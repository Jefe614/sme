from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.hashers import check_password, make_password
from django_tenants.utils import tenant_context
from django.utils import timezone

from tenants.models import Company
from core.models import Student


class ParentMobileLoginAPIView(APIView):
    """
    Mobile API for parent authentication using student's admission number and password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        admission_number = request.data.get("admission_number", "").strip()
        password = request.data.get("password", "").strip()
        schema_name = request.data.get("schema", "").strip()

        if not schema_name:
            return Response({"error": "Company schema is required"}, status=400)

        if not admission_number:
            return Response({"error": "Admission number is required"}, status=400)

        if not password:
            return Response({"error": "Password is required"}, status=400)

        try:
            company = Company.objects.get(schema_name=schema_name, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "Invalid school"}, status=400)

        with tenant_context(company):
            try:
                student = Student.objects.get(
                    admission_number=admission_number,
                    is_active=True
                )
            except Student.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=401)

            if not student.parent_password:
                return Response({"error": "Access not configured"}, status=401)

            if not check_password(password, student.parent_password):
                return Response({"error": "Invalid credentials"}, status=401)

            return Response({
                "message": "Parent login successful",
                "token": f"parent_{student.admission_number}_{int(timezone.now().timestamp())}"
            }, status=200)


class SetParentPasswordAPIView(APIView):
    """
    API to set parent password via SMS
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        admission_number = request.data.get("admission_number", "").strip()
        password = request.data.get("password", "").strip()
        schema_name = request.data.get("schema", "").strip()

        if not admission_number or not password:
            return Response({"error": "Admission number and password required"}, status=400)

        try:
            company = Company.objects.get(schema_name=schema_name, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "Invalid school"}, status=400)

        with tenant_context(company):
            try:
                student = Student.objects.get(admission_number=admission_number, is_active=True)
                student.parent_password = make_password(password)
                student.save()

                return Response({
                    "message": f"Password set for {student.first_name} {student.last_name}"
                }, status=200)
            except Student.DoesNotExist:
                return Response({"error": "Student not found"}, status=404)
