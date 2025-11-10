import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Count, Sum, Q
from django_tenants.utils import tenant_context
from rest_framework.permissions import AllowAny


from tenants.models import Company, Domain

from .models import Staff, StudentClass, Subject, Transaction, Student, FeePayment
from .serializers import (
    CompanySerializer,
    StaffSerializer,
    StudentClassSerializer,
    TransactionSerializer,
    StudentSerializer,
    FeePaymentSerializer,
)

from datetime import datetime
from django.db.models import Count
from django.utils import timezone
from datetime import datetime, timedelta
import uuid
from django.db import connection

class SignupAPIView(APIView):
    def post(self, request):
        data = request.data
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        company_name = data.get("company_name")
        company_type = data.get("company_type")

        if not all([username, password, company_name, company_type]):
            return Response({"message": "All fields are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"message": "Username already taken"}, status=400)

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)

        # Create unique schema name
        schema_name = company_name.lower().replace(' ', '')

        # Create company/tenant
        company = Company.objects.create(
            name=company_name,
            company_type=company_type,
            owner=user,
            paid_until=datetime.now().date() + timedelta(days=30),
            on_trial=True,
            schema_name=schema_name
        )

        # Create domain for tenant
        Domain.objects.create(
            domain=f"{schema_name}.localhost",
            tenant=company,
            is_primary=True
        )

        return Response({
            "message": "Signup successful",
            "token": token.key,
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "company": {"id": company.id, "name": company.name, "schema": company.schema_name}
        }, status=201)


# -------------------- Login --------------------
class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        schema_name = request.data.get("schema")  # optional

        if not username or not password:
            return Response({"message": "Username and password are required"}, status=400)

        if not schema_name or schema_name.strip() == "":
            schema_name = connection.schema_name

        if not schema_name or schema_name == "public":
            return Response({"message": "Invalid or missing company schema"}, status=400)

        try:
            company = Company.objects.get(schema_name=schema_name)
        except Company.DoesNotExist:
            return Response({"message": "Invalid company"}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"message": "Invalid credentials"}, status=401)

        if company.owner != user:
            return Response({"message": "User not associated with this company"}, status=401)

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "company": {
                "id": company.id,
                "name": company.name,
                "schema": company.schema_name,
                "company_type": company.company_type,
            }
        })



# -------------------- Company (read-only) --------------------
class CompanyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        companies = Company.objects.filter(owner=request.user)
        return Response({
            "message": "Companies fetched successfully",
            "companies": CompanySerializer(companies, many=True).data
        })


# -------------------- Students --------------------
class StudentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company
        
        # Get all students for the company
        students = Student.objects.filter(company=company)
        
        # Search filter
        q = request.query_params.get("q")
        if q:
            students = students.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(admission_number__icontains=q) |
                Q(parent_name__icontains=q)
            )
        
        # Filter by student type if provided
        student_type = request.query_params.get('student_type')
        if student_type:
            students = students.filter(student_type=student_type)
        
        # Filter by class if provided
        student_class = request.query_params.get('class')
        if student_class:
            students = students.filter(student_class_id=student_class)
        
        # Filter by active status if provided
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                students = students.filter(is_active=True)
            elif is_active.lower() == 'false':
                students = students.filter(is_active=False)
        
        # Order by latest first
        students = students.order_by('-date_joined')
        
        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)
        
        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1
        
        paginator = Paginator(students, page_size)
        
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1
        
        return Response({
            "message": "Students fetched successfully",
            "data": StudentSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })
    def post(self, request):
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        # === Use request.POST for form fields ===
        formData = request.POST
        files = request.FILES

        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None

        date_of_birth = parse_date(formData.get("date_of_birth"))
        admission_date = parse_date(formData.get("admission_date"))

        # Validate student_class
        student_class_id = formData.get("student_class")
        student_class = None
        if student_class_id:
            try:
                student_class = StudentClass.objects.get(id=student_class_id, company=company)
            except StudentClass.DoesNotExist:
                return Response({"error": "Invalid class ID"}, status=status.HTTP_400_BAD_REQUEST)

        student_data = {
            "company": company,
            "first_name": formData.get("first_name", "").strip(),
            "last_name": formData.get("last_name", "").strip(),
            "admission_number": formData.get("admission_number", "").strip(),
            "gender": formData.get("gender", ""),
            "date_of_birth": date_of_birth,
            "student_type": formData.get("student_type", "day"),
            "student_class": student_class,
            "admission_date": admission_date,
            "parent_name": formData.get("parent_name", "").strip(),
            "relationship": formData.get("relationship", ""),
            "parent_phone": formData.get("parent_phone", "").strip(),
            "nationality": formData.get("nationality", "").strip(),
            "roll_number": formData.get("roll_number", "").strip(),
            "parent_email": formData.get("parent_email", "").strip(),
            "address": formData.get("address", "").strip(),
            "hostel": formData.get("hostel", "").strip(),
            "blood_group": formData.get("blood_group", "").strip(),
            "allergies": formData.get("allergies", "").strip(),
            "medical_conditions": formData.get("medical_conditions", "").strip(),
        }

        # === Required Fields Validation ===
        required_fields = [
            'first_name', 'last_name', 'gender', 'date_of_birth',
            'student_class', 'admission_date', 'parent_name',
            'relationship', 'parent_phone'
        ]

        missing_fields = [field for field in required_fields if not student_data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # === Handle Profile Image ===
        profile_image = files.get('profile_image')
        if profile_image:
            student_data['profile_image'] = profile_image

        try:
            student = Student(**student_data)
            student.save()
            return Response({
                "message": "Student created successfully",
                "student": StudentSerializer(student).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            

# -------------------- Fee Payments --------------------
class FeePaymentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get("company")
        if not company_id:
            return Response({"error": "Company ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(id=company_id, owner=request.user, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "School company not found"}, status=status.HTTP_404_NOT_FOUND)

        with tenant_context(company):
            fees = FeePayment.objects.all()
            paginator = Paginator(fees, request.query_params.get("rows", 25))
            try:
                page = paginator.page(request.query_params.get("page", 1))
            except EmptyPage:
                page = paginator.page(1)

            return Response({
                "message": "Fee payments fetched successfully",
                "fee_payments": FeePaymentSerializer(page, many=True).data,
                "pagination": {
                    "currentPage": int(request.query_params.get("page", 1)),
                    "total": paginator.count,
                    "pageSize": int(request.query_params.get("rows", 25)),
                },
            })

    def post(self, request):
        formData = request.data
        company_id = formData.get("company")
        student_id = formData.get("student")
        amount = formData.get("amount")

        if not company_id or not student_id or not amount:
            return Response({"error": "Company, student, and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(id=company_id, owner=request.user, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "School company not found"}, status=status.HTTP_404_NOT_FOUND)

        with tenant_context(company):
            student = Student.objects.get(id=student_id)
            fee = FeePayment(student=student, amount=amount)
            fee.save()
            return Response(FeePaymentSerializer(fee).data, status=status.HTTP_201_CREATED)
        



class StudentClassView(APIView):
    def get(self, request):
        """
        Retrieve all active classes for the current tenant.
        """
        if not request.company:
            return Response(
                {"error": "No tenant found in request"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        classes = StudentClass.objects.filter(company=request.company, is_active=True)
        serializer = StudentClassSerializer(classes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new class for the current tenant with all validation in the view.
        """
        try:
            company = request.company
            if not request.company:
                return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
            if request.company.company_type != "SCHOOL":
                return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

            # Extract data
            data = request.data
            grade_level = data.get("grade_level", "").strip()
            section = data.get("section", "").strip()
            academic_year = data.get("academic_year", "").strip()
            max_students = data.get("max_students")
            class_teacher = data.get("class_teacher")
            room_number = data.get("room_number", "").strip()
            curriculum = data.get("curriculum", "").strip()
            class_schedule = data.get("class_schedule", "")
            is_active = data.get("is_active", True)
            name = data.get("name", "").strip()
            

            # Validate required fields
            required_fields = ['grade_level', 'section', 'academic_year', 'max_students']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return Response({
                    "error": f"Missing required fields: {', '.join(missing_fields)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate grade_level
            valid_grade_levels = [choice[0] for choice in StudentClass.GRADE_LEVELS]
            if grade_level not in valid_grade_levels:
                return Response({
                    "error": f"Invalid grade_level. Must be one of: {', '.join(valid_grade_levels)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate section
            valid_sections = [choice[0] for choice in StudentClass.SECTION_CHOICES]
            if section not in valid_sections:
                return Response({
                    "error": f"Invalid section. Must be one of: {', '.join(valid_sections)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate academic_year format (e.g., "2024-2025")
            if not academic_year or not isinstance(academic_year, str) or len(academic_year) != 9 or academic_year[4] != '-':
                return Response({
                    "error": "Invalid academic_year format. Must be 'YYYY-YYYY' (e.g., '2024-2025')"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate max_students
            try:
                max_students = int(max_students)
                if max_students < 1 or max_students > 60:  # Assuming 60 as max, per frontend
                    return Response({
                        "error": "max_students must be between 1 and 60"
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError):
                return Response({
                    "error": "max_students must be a valid integer"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate class_teacher (if provided)
            class_teacher_obj = None
            if class_teacher:
                try:
                    class_teacher_obj = Staff.objects.get(id=class_teacher, company=company)
                except Staff.DoesNotExist:
                    return Response({
                        "error": "Invalid class_teacher ID"
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Handle class_schedule (convert string to list)
            class_schedule_list = []
            if class_schedule:
                try:
                    class_schedule_list = json.loads(class_schedule) if class_schedule else []
                    if not isinstance(class_schedule_list, list):
                        class_schedule_list = [class_schedule]  # Treat as single-item list if not JSON
                except json.JSONDecodeError:
                    class_schedule_list = [class_schedule]  # Treat as string list if invalid JSON

            # Generate name if not provided
            if not name:
                name = f"{grade_level} - Section {section} ({academic_year})"

            # Prepare data for serialization
            student_class_data = {
                "name": name,
                "grade_level": grade_level,
                "section": section,
                "academic_year": academic_year,
                "class_teacher": class_teacher_obj,
                "max_students": max_students,
                "room_number": room_number,
                "curriculum": curriculum,
                "class_schedule": class_schedule_list,
                "is_active": is_active
            }

            serializer = StudentClassSerializer(data=student_class_data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response({
                    "message": "Class created successfully",
                    "class": serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class StaffAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle query parameters for filtering
        q = request.query_params.get("q")
        staff_type = request.query_params.get("staff_type")
        staff_role = request.query_params.get("staff_role")
        department = request.query_params.get("department")
        
        staff = Staff.objects.all()
        
        if q:
            staff = staff.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(staff_id__icontains=q) |
                Q(employee_number__icontains=q)
            )
        
        if staff_type:
            staff = staff.filter(staff_type=staff_type)
        
        if staff_role:
            staff = staff.filter(staff_role=staff_role)
        
        if department:
            staff = staff.filter(department=department)
        
        # Pagination
        paginator = Paginator(staff, request.query_params.get("rows", 25))
        try:
            page = paginator.page(request.query_params.get("page", 1))
        except EmptyPage:
            page = paginator.page(1)
        
        return Response({
            "message": "Staff fetched successfully",
            "staff": StaffSerializer(page, many=True).data,
            "pagination": {
                "currentPage": int(request.query_params.get("page", 1)),
                "total": paginator.count,
                "pageSize": int(request.query_params.get("rows", 25)),
            },
        })

    def post(self, request):
        formData = request.data
        company = request.company
        print("formData", formData)
        
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse date fields
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None
        
        # Parse boolean fields
        def parse_boolean(bool_str):
            if isinstance(bool_str, bool):
                return bool_str
            if isinstance(bool_str, str):
                return bool_str.lower() in ['true', '1', 'yes', 'on']
            return False
        
        date_of_birth = parse_date(formData.get("dateOfBirth"))
        date_joined = parse_date(formData.get("dateJoined"))
        contract_start_date = parse_date(formData.get("contractStartDate"))
        contract_end_date = parse_date(formData.get("contractEndDate"))
        probation_end_date = parse_date(formData.get("probationEndDate"))
        
        # Handle subjects and classes_taught (ManyToMany fields)
        subjects = formData.get("subjects", [])
        classes_taught = formData.get("classesTaught", [])
        
        # Parse JSON strings if they come as strings
        try:
            if isinstance(subjects, str):
                subjects = json.loads(subjects)
            if isinstance(classes_taught, str):
                classes_taught = json.loads(classes_taught)
        except json.JSONDecodeError:
            subjects = []
            classes_taught = []
        
        # Validate class_teacher_of (OneToOneField)
        class_teacher_of_id = formData.get("classTeacherOf")
        class_teacher_of = None
        if class_teacher_of_id and class_teacher_of_id != '':
            try:
                class_teacher_of = StudentClass.objects.get(id=class_teacher_of_id, company=company)
            except StudentClass.DoesNotExist:
                return Response({"error": "Invalid class teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        staff_data = {
            "company": company,
            "first_name": formData.get("firstName", "").strip(),
            "last_name": formData.get("lastName", "").strip(),
            "gender": formData.get("gender", ""),
            "date_of_birth": date_of_birth,
            "nationality": formData.get("nationality", "").strip(),
            "personal_phone": formData.get("personalPhone", "").strip(),
            "alternative_phone": formData.get("alternativePhone", "").strip(),
            "personal_email": formData.get("personalEmail", "").strip(),
            "emergency_contact_name": formData.get("emergencyContactName", "").strip(),
            "emergency_contact_phone": formData.get("emergencyContactPhone", "").strip(),
            "emergency_contact_relationship": formData.get("emergencyContactRelationship", "").strip(),
            "residential_address": formData.get("residentialAddress", "").strip(),
            "city": formData.get("city", "").strip(),
            "postal_code": formData.get("postalCode", "").strip(),
            "staff_type": formData.get("staffType", "teaching"),
            "staff_role": formData.get("staffRole", "teacher"),
            "department": formData.get("department", ""),
            "employment_type": formData.get("employmentType", "full_time"),
            "qualification": formData.get("qualification", ""),
            "specialization": formData.get("specialization", "").strip(),
            "tsc_number": formData.get("tscNumber", "").strip(),
            "kuppet_number": formData.get("kuppetNumber", "").strip(),
            "knut_number": formData.get("knutNumber", "").strip(),
            "date_joined": date_joined,
            "contract_start_date": contract_start_date,
            "contract_end_date": contract_end_date,
            "probation_end_date": probation_end_date,
            "is_class_teacher": parse_boolean(formData.get("isClassTeacher")),
            "class_teacher_of": class_teacher_of,
            "basic_salary": formData.get("basicSalary"),
            "bank_name": formData.get("bankName", "").strip(),
            "bank_account_number": formData.get("bankAccountNumber", "").strip(),
            "bank_branch": formData.get("bankBranch", "").strip(),
            "blood_group": formData.get("bloodGroup", ""),
            "allergies": formData.get("allergies", "").strip(),
            "medical_conditions": formData.get("medicalConditions", "").strip(),
            "doctor_info": formData.get("doctorInfo", "").strip(),
            "bio": formData.get("bio", "").strip(),
            "notes": formData.get("notes", "").strip(),
            "is_active": parse_boolean(formData.get("isActive", True)),
        }

        profile_image = request.FILES.get("profileImage")
        if profile_image:
            staff_data["profile_image"] = profile_image
        
        try:
            with tenant_context(company):
                staff = Staff(**staff_data)
                staff.save()
                
                # Handle ManyToMany fields after save
                if subjects:
                    subject_objects = Subject.objects.filter(id__in=subjects, company=company)
                    staff.subjects.set(subject_objects)
                
                if classes_taught:
                    class_objects = StudentClass.objects.filter(id__in=classes_taught, company=company)
                    staff.classes_taught.set(class_objects)
                
                return Response({
                    "message": "Staff created successfully",
                    "staff": StaffSerializer(staff).data
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, staff_id):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with tenant_context(company):
                staff = Staff.objects.get(staff_id=staff_id, company=company)
        except Staff.DoesNotExist:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)
        
        formData = request.data
        
        # Parse date fields
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None
        
        update_data = {}
        if "firstName" in formData:
            update_data["first_name"] = formData["firstName"].strip()
        if "lastName" in formData:
            update_data["last_name"] = formData["lastName"].strip()
        if "gender" in formData:
            update_data["gender"] = formData["gender"]
        if "dateOfBirth" in formData:
            update_data["date_of_birth"] = parse_date(formData["dateOfBirth"])
        if "nationality" in formData:
            update_data["nationality"] = formData["nationality"].strip()
        if "personalPhone" in formData:
            update_data["personal_phone"] = formData["personalPhone"].strip()
        if "alternativePhone" in formData:
            update_data["alternative_phone"] = formData["alternativePhone"].strip()
        if "personalEmail" in formData:
            update_data["personal_email"] = formData["personalEmail"].strip()
        if "emergencyContactName" in formData:
            update_data["emergency_contact_name"] = formData["emergencyContactName"].strip()
        if "emergencyContactPhone" in formData:
            update_data["emergency_contact_phone"] = formData["emergencyContactPhone"].strip()
        if "emergencyContactRelationship" in formData:
            update_data["emergency_contact_relationship"] = formData["emergencyContactRelationship"].strip()
        if "residentialAddress" in formData:
            update_data["residential_address"] = formData["residentialAddress"].strip()
        if "city" in formData:
            update_data["city"] = formData["city"].strip()
        if "postalCode" in formData:
            update_data["postal_code"] = formData["postalCode"].strip()
        if "staffType" in formData:
            update_data["staff_type"] = formData["staffType"]
        if "staffRole" in formData:
            update_data["staff_role"] = formData["staffRole"]
        if "department" in formData:
            update_data["department"] = formData["department"]
        if "employmentType" in formData:
            update_data["employment_type"] = formData["employmentType"]
        if "qualification" in formData:
            update_data["qualification"] = formData["qualification"]
        if "specialization" in formData:
            update_data["specialization"] = formData["specialization"].strip()
        if "tscNumber" in formData:
            update_data["tsc_number"] = formData["tscNumber"].strip()
        if "kuppetNumber" in formData:
            update_data["kuppet_number"] = formData["kuppetNumber"].strip()
        if "knutNumber" in formData:
            update_data["knut_number"] = formData["knutNumber"].strip()
        if "dateJoined" in formData:
            update_data["date_joined"] = parse_date(formData["dateJoined"])
        if "contractStartDate" in formData:
            update_data["contract_start_date"] = parse_date(formData["contractStartDate"])
        if "contractEndDate" in formData:
            update_data["contract_end_date"] = parse_date(formData["contractEndDate"])
        if "probationEndDate" in formData:
            update_data["probation_end_date"] = parse_date(formData["probationEndDate"])
        if "isClassTeacher" in formData:
            update_data["is_class_teacher"] = formData["isClassTeacher"]
        if "classTeacherOf" in formData:
            class_teacher_of_id = formData["classTeacherOf"]
            if class_teacher_of_id:
                try:
                    update_data["class_teacher_of"] = StudentClass.objects.get(id=class_teacher_of_id, company=company)
                except StudentClass.DoesNotExist:
                    return Response({"error": "Invalid class teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                update_data["class_teacher_of"] = None
        if "basicSalary" in formData:
            update_data["basic_salary"] = formData["basicSalary"]
        if "bankName" in formData:
            update_data["bank_name"] = formData["bankName"].strip()
        if "bankAccountNumber" in formData:
            update_data["bank_account_number"] = formData["bankAccountNumber"].strip()
        if "bankBranch" in formData:
            update_data["bank_branch"] = formData["bankBranch"].strip()
        if "bloodGroup" in formData:
            update_data["blood_group"] = formData["bloodGroup"]
        if "allergies" in formData:
            update_data["allergies"] = formData["allergies"].strip()
        if "medicalConditions" in formData:
            update_data["medical_conditions"] = formData["medicalConditions"].strip()
        if "doctorInfo" in formData:
            update_data["doctor_info"] = formData["doctorInfo"].strip()
        if "bio" in formData:
            update_data["bio"] = formData["bio"].strip()
        if "notes" in formData:
            update_data["notes"] = formData["notes"].strip()
        if "isActive" in formData:
            update_data["is_active"] = formData["isActive"]
        
        # Handle profile image
        profile_image = request.FILES.get("profileImage")
        if profile_image:
            update_data["profile_image"] = profile_image
        
        # Handle ManyToMany fields
        subjects = formData.get("subjects")
        classes_taught = formData.get("classesTaught")
        
        try:
            with tenant_context(company):
                for key, value in update_data.items():
                    setattr(staff, key, value)
                staff.save()
                
                if subjects is not None:
                    subject_objects = Subject.objects.filter(id__in=subjects, company=company)
                    staff.subjects.set(subject_objects)
                
                if classes_taught is not None:
                    class_objects = StudentClass.objects.filter(id__in=classes_taught, company=company)
                    staff.classes_taught.set(class_objects)
                
                return Response({
                    "message": "Staff updated successfully",
                    "staff": StaffSerializer(staff).data
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with tenant_context(company):
                staff = Staff.objects.get(id=pk, company=company)
                staff.delete()
                return Response({"message": "Staff deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Staff.DoesNotExist:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class TeacherAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company
        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        q = request.query_params.get("q")
        teachers = Staff.objects.filter(staff_type="teaching")
        
        if q:
            teachers = teachers.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(staff_id__icontains=q) |
                Q(employee_number__icontains=q)
            )
        
        # Additional filters for subjects or classes
        subject_id = request.query_params.get("subject")
        class_id = request.query_params.get("class")
        
        if subject_id:
            teachers = teachers.filter(subjects__id=subject_id)
        
        if class_id:
            teachers = teachers.filter(classes_taught__id=class_id)
        
        # Pagination
        paginator = Paginator(teachers, request.query_params.get("rows", 25))
        try:
            page = paginator.page(request.query_params.get("page", 1))
        except EmptyPage:
            page = paginator.page(1)
        
        return Response({
            "message": "Teachers fetched successfully",
            "teachers": StaffSerializer(page, many=True).data,
            "pagination": {
                "currentPage": int(request.query_params.get("page", 1)),
                "total": paginator.count,
                "pageSize": int(request.query_params.get("rows", 25)),
            },
        })


class SchoolDashboardSummaryAPIView(APIView):
    def get(self, request):
        company = request.company
        
        if not company:
            return Response({"error": "No tenant found"}, status=status.HTTP_400_BAD_REQUEST)
        
        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Student Statistics
            total_students = Student.objects.filter(company=company).count()
            boarding_students = Student.objects.filter(company=company, student_type='boarding').count()
            day_students = Student.objects.filter(company=company, student_type='day').count()
            
            # Gender distribution
            male_students = Student.objects.filter(company=company, gender='male').count()
            female_students = Student.objects.filter(company=company, gender='female').count()
            other_students = Student.objects.filter(company=company).exclude(gender__in=['male', 'female']).count()
            
            # Teacher Statistics
            total_teachers = Staff.objects.filter(company=company, staff_type='teaching', is_active=True).count()
            total_staff = Staff.objects.filter(company=company, is_active=True).count()
            
            # Class Statistics
            total_classes = StudentClass.objects.filter(company=company).count()
            
            # Fee Statistics
            fee_stats = FeePayment.objects.filter(
                company=company, 
                payment_status='completed'
            ).aggregate(
                total_collected=Sum('amount_paid')
            )
            
            # Calculate pending fees (total due - total paid)
            pending_fee_stats = FeePayment.objects.filter(
                company=company
            ).aggregate(
                total_due=Sum('due_amount'),
                total_paid=Sum('amount_paid')
            )
            
            fees_collected = fee_stats['total_collected'] or 0
            total_due = pending_fee_stats['total_due'] or 0
            total_paid = pending_fee_stats['total_paid'] or 0
            pending_fees = max(total_due - total_paid, 0)
            
            # Calculate student change (last 30 days vs previous 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            sixty_days_ago = timezone.now() - timedelta(days=60)
            
            recent_students = Student.objects.filter(
                company=company, 
                date_joined__gte=thirty_days_ago
            ).count()
            
            previous_students = Student.objects.filter(
                company=company,
                date_joined__gte=sixty_days_ago,
                date_joined__lt=thirty_days_ago
            ).count()
            
            student_change = self._calculate_percentage_change(previous_students, recent_students)
            
            # Teacher change calculation
            recent_teachers = Staff.objects.filter(
                company=company,
                staff_type='teaching',
                date_joined__gte=thirty_days_ago
            ).count()
            
            previous_teachers = Staff.objects.filter(
                company=company,
                staff_type='teaching',
                date_joined__gte=sixty_days_ago,
                date_joined__lt=thirty_days_ago
            ).count()
            
            teacher_change = self._calculate_percentage_change(previous_teachers, recent_teachers)
            
            # Fee collection change (this month vs last month)
            this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month = (this_month - timedelta(days=1)).replace(day=1)
            
            this_month_fees = FeePayment.objects.filter(
                company=company,
                payment_status='completed',
                payment_date__gte=this_month
            ).aggregate(total=Sum('amount_paid'))['total'] or 0
            
            last_month_fees = FeePayment.objects.filter(
                company=company,
                payment_status='completed',
                payment_date__gte=last_month,
                payment_date__lt=this_month
            ).aggregate(total=Sum('amount_paid'))['total'] or 0
            
            fee_change = self._calculate_percentage_change(last_month_fees, this_month_fees)
            
            # Recent activities (last 5 students/teachers)
            recent_students_list = Student.objects.filter(company=company).order_by('-date_joined')[:5]
            recent_teachers_list = Staff.objects.filter(company=company, staff_type='teaching').order_by('-date_joined')[:3]
            recent_payments = FeePayment.objects.filter(
                company=company, 
                payment_status='completed'
            ).order_by('-payment_date')[:3]
            
            recent_activities = []
            
            for student in recent_students_list:
                recent_activities.append({
                    'description': f'New student registered: {student.first_name} {student.last_name}',
                    'time': self._time_ago(student.date_joined),
                    'type': 'student',
                    'icon': 'student'
                })
            
            for teacher in recent_teachers_list:
                recent_activities.append({
                    'description': f'New teacher joined: {teacher.first_name} {teacher.last_name}',
                    'time': self._time_ago(teacher.date_joined),
                    'type': 'teacher',
                    'icon': 'teacher'
                })
            
            for payment in recent_payments:
                recent_activities.append({
                    'description': f'Fee payment received: {payment.student.first_name} {payment.student.last_name} - KSh {payment.amount_paid:,.0f}',
                    'time': self._time_ago(payment.payment_date),
                    'type': 'payment',
                    'icon': 'payment'
                })
            
            # Sort activities by time (newest first) and take latest 6
            recent_activities.sort(key=lambda x: x['time'], reverse=False)
            recent_activities = recent_activities[:6]
            
            # Calculate pending fees change
            previous_month_pending = FeePayment.objects.filter(
                company=company,
                created_at__gte=last_month,
                created_at__lt=this_month
            ).aggregate(
                total_due=Sum('due_amount'),
                total_paid=Sum('amount_paid')
            )
            
            prev_due = previous_month_pending['total_due'] or 0
            prev_paid = previous_month_pending['total_paid'] or 0
            previous_pending = max(prev_due - prev_paid, 0)
            
            pending_change = self._calculate_percentage_change(previous_pending, pending_fees)
            # Negative change is good for pending fees, so invert it
            pending_change = -pending_change if pending_fees < previous_pending else pending_change
            
            # Class distribution
            class_distribution = StudentClass.objects.filter(company=company).annotate(
                student_count=Count('students')
            ).values('name', 'student_count').order_by('-student_count')[:6]
            
            class_labels = [cls['name'] for cls in class_distribution]
            class_data = [cls['student_count'] for cls in class_distribution]
            
            # Staff distribution by type
            staff_by_type = Staff.objects.filter(company=company, is_active=True).values(
                'staff_type'
            ).annotate(
                count=Count('id')
            )
            
            staff_type_labels = [staff['staff_type'].replace('_', ' ').title() for staff in staff_by_type]
            staff_type_data = [staff['count'] for staff in staff_by_type]
            
            # Fee collection trend (last 6 months)
            six_months_ago = timezone.now() - timedelta(days=180)
            monthly_fees = FeePayment.objects.filter(
                company=company,
                payment_status='completed',
                payment_date__gte=six_months_ago
            ).extra({
                'month': "EXTRACT(month FROM payment_date)",
                'year': "EXTRACT(year FROM payment_date)"
            }).values('year', 'month').annotate(
                total=Sum('amount_paid')
            ).order_by('year', 'month')
            
            # Prepare fee trend data
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            fee_trend_labels = []
            fee_trend_data = []
            
            for fee_data in monthly_fees:
                month_idx = int(fee_data['month']) - 1
                fee_trend_labels.append(month_names[month_idx])
                fee_trend_data.append(float(fee_data['total'] or 0))
            
            # Fee trend
            fee_trend = {
                'labels': fee_trend_labels,
                'data': fee_trend_data
            }
            
            # Fee breakdown by type (you can enhance this with actual fee structure data)
            fee_breakdown = {
                'labels': ['Tuition', 'Boarding', 'Transport', 'Activities', 'Other'],
                'data': [120000, 80000, 45000, 25000, 15000]
            }
            
            # Gender distribution for frontend
            gender_distribution = {
                'labels': ['Male', 'Female', 'Other'],
                'data': [male_students, female_students, other_students]
            }
            
            return Response({
                'stats': {
                    'students': {
                        'total': total_students,
                        'change': student_change,
                        'boarding': boarding_students,
                        'day': day_students,
                        'male': male_students,
                        'female': female_students,
                        'other': other_students
                    },
                    'teachers': {
                        'total': total_teachers,
                        'change': teacher_change
                    },
                    'staff': {
                        'total': total_staff,
                        'change': self._calculate_percentage_change(
                            total_staff - recent_students,
                            total_staff
                        ),
                        'by_type': {
                            'labels': staff_type_labels,
                            'data': staff_type_data
                        }
                    },
                    'classes': {
                        'total': total_classes,
                        'change': 0
                    },
                    'feesCollected': {
                        'total': fees_collected,
                        'change': fee_change
                    },
                    'pendingFees': {
                        'total': pending_fees,
                        'change': pending_change
                    }
                },
                'feeTrend': fee_trend,
                'feeBreakdown': fee_breakdown,
                'classDistribution': {
                    'labels': class_labels,
                    'data': class_data
                },
                'genderDistribution': gender_distribution,
                'recentActivities': recent_activities,
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _calculate_percentage_change(self, old_value, new_value):
        if old_value == 0:
            return 100 if new_value > 0 else 0
        return round(((new_value - old_value) / old_value) * 100)
    
    def _time_ago(self, timestamp):
        if isinstance(timestamp, timezone.datetime):
            now = timezone.now()
            diff = now - timestamp
        else:  # It's a date field
            now = timezone.now().date()
            diff = now - timestamp
            
        if diff.days > 0:
            if diff.days == 1:
                return '1 day ago'
            return f'{diff.days} days ago'
        elif hasattr(diff, 'seconds') and diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f'{hours} hour{"s" if hours > 1 else ""} ago'
        elif hasattr(diff, 'seconds') and diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
        else:
            return 'Just now'
        
# -------------------- Transactions (SME) --------------------
class TransactionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get("company")
        if not company_id:
            return Response({"error": "Company ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(id=company_id, owner=request.user, company_type="SME")
        except Company.DoesNotExist:
            return Response({"error": "SME company not found"}, status=status.HTTP_404_NOT_FOUND)

        with tenant_context(company):
            transactions = Transaction.objects.all()
            paginator = Paginator(transactions, request.query_params.get("rows", 25))
            try:
                page = paginator.page(request.query_params.get("page", 1))
            except EmptyPage:
                page = paginator.page(1)

            return Response({
                "message": "Transactions fetched successfully",
                "transactions": TransactionSerializer(page, many=True).data,
                "pagination": {
                    "currentPage": int(request.query_params.get("page", 1)),
                    "total": paginator.count,
                    "pageSize": int(request.query_params.get("rows", 25)),
                },
            })

    def post(self, request):
        formData = request.data
        company_id = formData.get("company")
        description = formData.get("description")
        amount = formData.get("amount")
        is_income = formData.get("is_income", True)

        if not company_id or not description or not amount:
            return Response({"error": "Company, description, and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(id=company_id, company_type="SME", owner=request.user)
        except Company.DoesNotExist:
            return Response({"error": "SME Company not found"}, status=status.HTTP_404_NOT_FOUND)

        with tenant_context(company):
            transaction = Transaction(company=company, description=description, amount=amount, is_income=is_income)
            transaction.save()
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
