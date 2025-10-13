from django.db import models
from django.contrib.auth.models import User
from django_tenants.models import TenantMixin, DomainMixin


class Company(TenantMixin):
    COMPANY_TYPES = (
        ("SME", "Small/Medium Enterprise"),
        ("SCHOOL", "School"),
    )
    name = models.CharField(max_length=255)
    company_type = models.CharField(max_length=10, choices=COMPANY_TYPES)
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tenant")
    paid_until = models.DateField()
    on_trial = models.BooleanField(default=True)
    schema_name = models.CharField(max_length=63, unique=True, null=True, blank=True)
    auto_create_schema = True 

    def __str__(self):
        return f"{self.name} ({self.company_type})"
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        db_table = "frontend_company"


class Domain(DomainMixin):
    pass
