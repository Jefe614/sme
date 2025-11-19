import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage
from django_tenants.utils import tenant_context
from tenants.models import Company

from .models import DocumentTemplate
from .serializers import DocumentTemplateSerializer


class DocumentTemplateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        # Search and filter
        q = request.query_params.get("q")
        category = request.query_params.get("category")
        is_active = request.query_params.get("is_active")
        is_default = request.query_params.get("is_default")

        templates = DocumentTemplate.objects.filter(company=company)

        if q:
            templates = templates.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(template_body__icontains=q)
            )

        if category:
            templates = templates.filter(category=category)

        if is_active is not None:
            if is_active.lower() == 'true':
                templates = templates.filter(is_active=True)
            elif is_active.lower() == 'false':
                templates = templates.filter(is_active=False)

        if is_default is not None:
            if is_default.lower() == 'true':
                templates = templates.filter(is_default=True)
            elif is_default.lower() == 'false':
                templates = templates.filter(is_default=False)

        # Order by name
        templates = templates.order_by('name')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(templates, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Templates fetched successfully",
            "data": DocumentTemplateSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        required_fields = ['name', 'category', 'template_body']

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        template_data = {
            "company": company,
            "name": data.get("name").strip(),
            "category": data.get("category"),
            "template_body": data.get("template_body").strip(),
            "description": data.get("description", "").strip(),
            "is_default": data.get("is_default", False),
            "is_active": data.get("is_active", True),
        }

        # Check for duplicate name in this company
        if DocumentTemplate.objects.filter(company=company, name=template_data["name"]).exists():
            return Response({
                "error": f"Template with name '{template_data['name']}' already exists"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = DocumentTemplate(**template_data)
            template.save()
            return Response({
                "message": "Template created successfully",
                "template": DocumentTemplateSerializer(template).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DocumentTemplateDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, template_id):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = DocumentTemplate.objects.get(id=template_id, company=company)
            return Response({
                "message": "Template fetched successfully",
                "template": DocumentTemplateSerializer(template).data
            })
        except DocumentTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, template_id):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = DocumentTemplate.objects.get(id=template_id, company=company)
        except DocumentTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        update_fields = ['name', 'category', 'template_body', 'description', 'is_active']

        for field in update_fields:
            if field in data:
                if field in ['name', 'template_body']:
                    setattr(template, field, data[field].strip())
                else:
                    setattr(template, field, data[field])

        # Check for duplicate name (excluding this template)
        if 'name' in data:
            if DocumentTemplate.objects.filter(company=company, name=data['name']).exclude(id=template_id).exists():
                return Response({
                    "error": f"Template with name '{data['name']}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            template.save()
            return Response({
                "message": "Template updated successfully",
                "template": DocumentTemplateSerializer(template).data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, template_id):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = DocumentTemplate.objects.get(id=template_id, company=company)
            template.delete()
            return Response({"message": "Template deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except DocumentTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TemplateCategoriesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get available template categories"""
        categories = []
        for choice in DocumentTemplate.TEMPLATE_CATEGORIES:
            categories.append({
                "value": choice[0],
                "label": choice[1]
            })

        return Response({
            "message": "Template categories fetched successfully",
            "categories": categories
        })


class GenerateDocumentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Generate a document from template with data substitution"""
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        template_id = data.get("template_id")
        template_data = data.get("template_data", {})

        if not template_id:
            return Response({"error": "Template ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = DocumentTemplate.objects.get(id=template_id, company=company, is_active=True)
        except DocumentTemplate.DoesNotExist:
            return Response({"error": "Template not found or inactive"}, status=status.HTTP_404_NOT_FOUND)

        # Generate document by substituting placeholders
        document_body = template.template_body

        # Replace placeholders
        for key, value in template_data.items():
            placeholder = f"{{{{{key}}}}}"
            document_body = document_body.replace(placeholder, str(value))

        # Check for any remaining placeholders
        import re
        remaining_placeholders = re.findall(r'\{\{(\w+)\}\}', document_body)
        if remaining_placeholders:
            return Response({
                "error": f"The following placeholders are not provided: {', '.join(remaining_placeholders)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": "Document generated successfully",
            "document": {
                "title": template.name,
                "body": document_body,
                "category": template.category,
                "generated_at": json.dumps({"timestamp": "now"}),  # You can use proper datetime here
            }
        })
