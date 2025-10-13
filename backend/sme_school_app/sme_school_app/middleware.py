from django.db import connection
from django.http import HttpResponse
from django_tenants.middleware.main import TenantMainMiddleware
from django_tenants.utils import get_public_schema_name
from tenants.models import Domain, Company
import logging

logger = logging.getLogger(__name__)

class CompanyTenantMiddleware(TenantMainMiddleware):
    PUBLIC_PATHS = ['/api/signup/', '/api/login/']

    def process_request(self, request):
        if any(request.path.startswith(path) for path in self.PUBLIC_PATHS):
            connection.set_schema_to_public()
            request.company = None
            return None

        # Resolve tenant by hostname
        hostname = request.get_host().split(":")[0]
        if not hostname:
            connection.set_schema_to_public()
            return HttpResponse("Invalid tenant", status=404)

        try:
            domain = Domain.objects.select_related("tenant").get(domain=hostname)
            company = domain.tenant
        except Domain.DoesNotExist:
            connection.set_schema_to_public()
            return HttpResponse("Invalid tenant", status=404)

        # Switch tenant schema
        connection.set_tenant(company)
        request.company = company
