from django.core.management.base import BaseCommand
from django_tenants.utils import tenant_context
from tenants.models import Company
from core.models import GradingSystem


class Command(BaseCommand):
    help = 'Populate default grading systems for schools'

    def handle(self, *args, **options):
        # Get all school companies
        school_companies = Company.objects.filter(company_type='SCHOOL')

        for company in school_companies:
            with tenant_context(company):
                self.stdout.write(f"Populating grading systems for {company.name}...")

                # Check if default grading systems already exist
                if GradingSystem.objects.filter(company=company).exists():
                    self.stdout.write(f"Grading systems already exist for {company.name}, skipping...")
                    continue

                # Create KCSE/8-4-4 Grading System
                kcse_grading = GradingSystem.objects.create(
                    company=company,
                    name="KCSE Grading System (8-4-4)",
                    grading_type="8-4-4",
                    grading_scale=[
                        {"min_mark": 80, "max_mark": 100, "grade": "A", "points": 12},
                        {"min_mark": 75, "max_mark": 79, "grade": "A-", "points": 11},
                        {"min_mark": 70, "max_mark": 74, "grade": "B+", "points": 10},
                        {"min_mark": 65, "max_mark": 69, "grade": "B", "points": 9},
                        {"min_mark": 60, "max_mark": 64, "grade": "B-", "points": 8},
                        {"min_mark": 55, "max_mark": 59, "grade": "C+", "points": 7},
                        {"min_mark": 50, "max_mark": 54, "grade": "C", "points": 6},
                        {"min_mark": 45, "max_mark": 49, "grade": "C-", "points": 5},
                        {"min_mark": 40, "max_mark": 44, "grade": "D+", "points": 4},
                        {"min_mark": 35, "max_mark": 39, "grade": "D", "points": 3},
                        {"min_mark": 30, "max_mark": 34, "grade": "D-", "points": 2},
                        {"min_mark": 0, "max_mark": 29, "grade": "E", "points": 1}
                    ],
                    is_default=True,
                    is_active=True
                )

                # Create CBC Primary Grading System
                cbc_primary = GradingSystem.objects.create(
                    company=company,
                    name="CBC Primary Level Grading",
                    grading_type="cbc",
                    grading_scale=[
                        {"level": "Exceeding Expectations", "description": "The learner has exceeded the learning outcomes"},
                        {"level": "Meeting Expectations", "description": "The learner has met the learning outcomes"},
                        {"level": "Approaching Expectations", "description": "The learner is approaching the learning outcomes"},
                        {"level": "Below Expectations", "description": "The learner is below the learning outcomes"}
                    ],
                    is_default=False,
                    is_active=True
                )

                # Create CBC Secondary Grading System
                cbc_secondary = GradingSystem.objects.create(
                    company=company,
                    name="CBC Secondary Level Grading",
                    grading_type="cbc",
                    grading_scale=[
                        {"level": "Exceeding Expectations", "description": "The learner has exceeded the learning outcomes"},
                        {"level": "Meeting Expectations", "description": "The learner has met the learning outcomes"},
                        {"level": "Approaching Expectations", "description": "The learner is approaching the learning outcomes"},
                        {"level": "Below Expectations", "description": "The learner is below the learning outcomes"}
                    ],
                    is_default=False,
                    is_active=True
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully created grading systems for {company.name}: "
                        f"KCSE (8-4-4), CBC Primary, CBC Secondary"
                    )
                )

        self.stdout.write(self.style.SUCCESS("Grading systems population completed!"))
