from django.core.management.base import BaseCommand
from django_tenants.utils import tenant_context
from tenants.models import Company
from core.models import DocumentTemplate
from core.default_templates import DEFAULT_DOCUMENT_TEMPLATES

class Command(BaseCommand):
    help = 'Populate default document templates for all school tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Specific tenant schema to populate (e.g., school1.localhost)',
            default=None
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Overwrite existing templates',
            default=False
        )

    def handle(self, *args, **options):
        tenants = []
        if options['tenant']:
            try:
                tenant = Company.objects.get(schema_name=options['tenant'], company_type='SCHOOL')
                tenants = [tenant]
            except Company.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Tenant '{options['tenant']}' not found or not a school")
                )
                return
        else:
            tenants = Company.objects.filter(company_type='SCHOOL')

        if not tenants:
            self.stdout.write(
                self.style.WARNING('No school tenants found')
            )
            return

        total_created = 0
        total_updated = 0
        total_skipped = 0

        for tenant in tenants:
            self.stdout.write(
                self.style.SUCCESS(f"\nPopulating templates for tenant: {tenant.name} ({tenant.schema_name})")
            )

            with tenant_context(tenant):
                for template_data in DEFAULT_DOCUMENT_TEMPLATES:
                    name = template_data['name']
                    category = template_data['category']

                    # Check if template already exists
                    existing = DocumentTemplate.objects.filter(
                        name=name,
                        category=category
                    ).first()

                    if existing:
                        if options['overwrite']:
                            # Update existing template
                            for key, value in template_data.items():
                                if hasattr(existing, key):
                                    setattr(existing, key, value)
                            existing.save()
                            total_updated += 1
                            self.stdout.write(
                                f"  Updated: {name}"
                            )
                        else:
                            total_skipped += 1
                            self.stdout.write(
                                f"  Skipped (existing): {name}"
                            )
                    else:
                        # Create new template
                        try:
                            DocumentTemplate.objects.create(
                                company=tenant,
                                **template_data
                            )
                            total_created += 1
                            self.stdout.write(
                                f"  Created: {name}"
                            )
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f"  Failed to create {name}: {str(e)}")
                            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary:\n"
                f"  Created: {total_created}\n"
                f"  Updated: {total_updated}\n"
                f"  Skipped: {total_skipped}"
            )
        )
