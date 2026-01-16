import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Count, Q
from django_tenants.utils import tenant_context
from datetime import datetime


from tenants.models import Company
from .models import AcademicYear, Term, ClassSubjectAssignment, StudentClass, Subject, Staff
from .serializers import AcademicYearSerializer, SubjectSerializer, TermSerializer, ClassSubjectAssignmentSerializer


# -------------------- Academic Year Management --------------------
class AcademicYearAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get academic years for the school"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                academic_year = AcademicYear.objects.get(id=pk, company=company)
                serializer = AcademicYearSerializer(academic_year)
                return Response({
                    "message": "Academic year retrieved successfully",
                    "academic_year": serializer.data
                })
            except AcademicYear.DoesNotExist:
                return Response({"error": "Academic year not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all academic years
        academic_years = AcademicYear.objects.filter(company=company)

        # Search filter
        q = request.query_params.get("q")
        if q:
            academic_years = academic_years.filter(
                Q(name__icontains=q)
            )

        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                academic_years = academic_years.filter(is_active=True)
            elif is_active.lower() == 'false':
                academic_years = academic_years.filter(is_active=False)

        # Order by most recent first
        academic_years = academic_years.order_by('-start_date')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(academic_years, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Academic years fetched successfully",
            "data": AcademicYearSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new academic year"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        name = data.get("name", "").strip()
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        is_active = data.get("is_active", False)

        # Validation
        required_fields = ['name', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse dates
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            academic_year = AcademicYear(
                company=company,
                name=name,
                start_date=start_date,
                end_date=end_date,
                is_active=is_active
            )
            academic_year.full_clean()  # Run model validations
            academic_year.save()

            return Response({
                "message": "Academic year created successfully",
                "academic_year": AcademicYearSerializer(academic_year).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update an academic year"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            academic_year = AcademicYear.objects.get(id=pk, company=company)
        except AcademicYear.DoesNotExist:
            return Response({"error": "Academic year not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"].strip()
        if "start_date" in data:
            try:
                update_data["start_date"] = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid start_date format"}, status=status.HTTP_400_BAD_REQUEST)
        if "end_date" in data:
            try:
                update_data["end_date"] = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid end_date format"}, status=status.HTTP_400_BAD_REQUEST)
        if "is_active" in data:
            update_data["is_active"] = data["is_active"]
        if "is_archived" in data:
            update_data["is_archived"] = data["is_archived"]

        try:
            for key, value in update_data.items():
                setattr(academic_year, key, value)
            academic_year.full_clean()  # Run model validations
            academic_year.save()

            return Response({
                "message": "Academic year updated successfully",
                "academic_year": AcademicYearSerializer(academic_year).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete an academic year"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            academic_year = AcademicYear.objects.get(id=pk, company=company)
            name = academic_year.name
            academic_year.delete()

            return Response({
                "message": f"Academic year '{name}' deleted successfully"
            })

        except AcademicYear.DoesNotExist:
            return Response({"error": "Academic year not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# -------------------- Term Management --------------------
class TermAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get terms for the school"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                term = Term.objects.get(id=pk, academic_year__company=company)
                serializer = TermSerializer(term)
                return Response({
                    "message": "Term retrieved successfully",
                    "term": serializer.data
                })
            except Term.DoesNotExist:
                return Response({"error": "Term not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all terms
        terms = Term.objects.filter(academic_year__company=company)

        # Filter by academic year
        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            terms = terms.filter(academic_year_id=academic_year_id)

        # Filter by current status
        is_current = request.query_params.get('is_current')
        if is_current is not None:
            if is_current.lower() == 'true':
                terms = terms.filter(is_current=True)
            elif is_current.lower() == 'false':
                terms = terms.filter(is_current=False)

        # Order by academic year and start date
        terms = terms.order_by('academic_year__start_date', 'start_date')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(terms, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Terms fetched successfully",
            "data": TermSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new term"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        academic_year_id = data.get("academic_year")
        name = data.get("name", "").strip()
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        is_current = data.get("is_current", False)

        # Validation
        required_fields = ['academic_year', 'name', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate academic year belongs to company
        try:
            academic_year = AcademicYear.objects.get(id=academic_year_id, company=company)
        except AcademicYear.DoesNotExist:
            return Response({"error": "Invalid academic year"}, status=status.HTTP_400_BAD_REQUEST)

        # Parse dates
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            term = Term(
                academic_year=academic_year,
                name=name,
                start_date=start_date,
                end_date=end_date,
                is_current=is_current
            )
            term.full_clean()  # Run model validations
            term.save()

            return Response({
                "message": "Term created successfully",
                "term": TermSerializer(term).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update a term"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            term = Term.objects.get(id=pk, academic_year__company=company)
        except Term.DoesNotExist:
            return Response({"error": "Term not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"].strip()
        if "start_date" in data:
            try:
                update_data["start_date"] = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid start_date format"}, status=status.HTTP_400_BAD_REQUEST)
        if "end_date" in data:
            try:
                update_data["end_date"] = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid end_date format"}, status=status.HTTP_400_BAD_REQUEST)
        if "is_current" in data:
            update_data["is_current"] = data["is_current"]
        if "is_locked" in data:
            update_data["is_locked"] = data["is_locked"]

        try:
            for key, value in update_data.items():
                setattr(term, key, value)
            term.full_clean()  # Run model validations
            term.save()

            return Response({
                "message": "Term updated successfully",
                "term": TermSerializer(term).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete a term"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            term = Term.objects.get(id=pk, academic_year__company=company)
            name = f"{term.academic_year.name} - {term.name}"
            term.delete()

            return Response({
                "message": f"Term '{name}' deleted successfully"
            })

        except Term.DoesNotExist:
            return Response({"error": "Term not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# -------------------- Class-Subject Assignment Management --------------------
class ClassSubjectAssignmentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get class-subject assignments for the school"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                assignment = ClassSubjectAssignment.objects.get(
                    id=pk,
                    student_class__company=company
                )
                serializer = ClassSubjectAssignmentSerializer(assignment)
                return Response({
                    "message": "Class-subject assignment retrieved successfully",
                    "assignment": serializer.data
                })
            except ClassSubjectAssignment.DoesNotExist:
                return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all assignments
        assignments = ClassSubjectAssignment.objects.filter(student_class__company=company)

        # Filter by academic year
        academic_year_id = request.query_params.get('academic_year')
        if academic_year_id:
            assignments = assignments.filter(academic_year_id=academic_year_id)

        # Filter by class
        class_id = request.query_params.get('class')
        if class_id:
            assignments = assignments.filter(student_class_id=class_id)

        # Filter by subject
        subject_id = request.query_params.get('subject')
        if subject_id:
            assignments = assignments.filter(subject_id=subject_id)

        # Filter by teacher
        teacher_id = request.query_params.get('teacher')
        if teacher_id:
            assignments = assignments.filter(teacher_id=teacher_id)

        # Order by academic year, class, subject
        assignments = assignments.order_by('academic_year__start_date', 'student_class__name', 'subject__name')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(assignments, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Class-subject assignments fetched successfully",
            "data": ClassSubjectAssignmentSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new class-subject assignment"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        student_class_id = data.get("student_class")
        subject_id = data.get("subject")
        academic_year_id = data.get("academic_year")
        teacher_id = data.get("teacher")

        # Validation
        required_fields = ['student_class', 'subject', 'academic_year']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate all entities belong to the company
        try:
            student_class = StudentClass.objects.get(id=student_class_id, company=company)
            subject = Subject.objects.get(id=subject_id, company=company)
            academic_year = AcademicYear.objects.get(id=academic_year_id, company=company)
        except (StudentClass.DoesNotExist, Subject.DoesNotExist, AcademicYear.DoesNotExist):
            return Response({"error": "Invalid class, subject, or academic year"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate teacher if provided
        teacher = None
        if teacher_id:
            try:
                teacher = Staff.objects.get(id=teacher_id, company=company)
            except Staff.DoesNotExist:
                return Response({"error": "Invalid teacher"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = ClassSubjectAssignment(
                student_class=student_class,
                subject=subject,
                academic_year=academic_year,
                teacher=teacher
            )
            assignment.full_clean()  # Run model validations
            assignment.save()

            return Response({
                "message": "Class-subject assignment created successfully",
                "assignment": ClassSubjectAssignmentSerializer(assignment).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update a class-subject assignment"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = ClassSubjectAssignment.objects.get(
                id=pk,
                student_class__company=company
            )
        except ClassSubjectAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        update_data = {}

        # Validate teacher if provided
        if "teacher" in data:
            teacher_id = data["teacher"]
            if teacher_id:
                try:
                    update_data["teacher"] = Staff.objects.get(id=teacher_id, company=company)
                except Staff.DoesNotExist:
                    return Response({"error": "Invalid teacher"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                update_data["teacher"] = None

        if "is_active" in data:
            update_data["is_active"] = data["is_active"]

        try:
            for key, value in update_data.items():
                setattr(assignment, key, value)
            assignment.full_clean()  # Run model validations
            assignment.save()

            return Response({
                "message": "Class-subject assignment updated successfully",
                "assignment": ClassSubjectAssignmentSerializer(assignment).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete a class-subject assignment"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = ClassSubjectAssignment.objects.get(
                id=pk,
                student_class__company=company
            )
            name = f"{assignment.student_class.name} - {assignment.subject.name}"
            assignment.delete()

            return Response({
                "message": f"Assignment '{name}' deleted successfully"
            })

        except ClassSubjectAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# -------------------- Subject Management --------------------
class SubjectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get subjects for the school"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                subject = Subject.objects.get(id=pk, company=company)
                serializer = SubjectSerializer(subject)
                return Response({
                    "message": "Subject retrieved successfully",
                    "subject": serializer.data
                })
            except Subject.DoesNotExist:
                return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all subjects
        subjects = Subject.objects.filter(company=company)

        # Search filter
        q = request.query_params.get("q")
        if q:
            subjects = subjects.filter(
                Q(name__icontains=q) | Q(code__icontains=q)
            )

        # Filter by category
        category = request.query_params.get('category')
        if category:
            subjects = subjects.filter(category=category)

        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                subjects = subjects.filter(is_active=True)
            elif is_active.lower() == 'false':
                subjects = subjects.filter(is_active=False)

        # Order by name
        subjects = subjects.order_by('name')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(subjects, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Subjects fetched successfully",
            "data": SubjectSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new subject"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        # Add company to the data
        data = request.data.copy()
        data['company'] = company.id

        serializer = SubjectSerializer(data=data)
        if serializer.is_valid():
            try:
                subject = serializer.save(company=company)
                return Response({
                    "message": "Subject created successfully",
                    "subject": SubjectSerializer(subject).data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update a subject"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=pk, company=company)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        # Add company to the data
        data = request.data.copy()
        data['company'] = company.id

        serializer = SubjectSerializer(subject, data=data, partial=True)
        if serializer.is_valid():
            try:
                subject = serializer.save()
                return Response({
                    "message": "Subject updated successfully",
                    "subject": SubjectSerializer(subject).data
                })
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete a subject"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=pk, company=company)
            name = subject.name
            subject.delete()

            return Response({
                "message": f"Subject '{name}' deleted successfully"
            })

        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
