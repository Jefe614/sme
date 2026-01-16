import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Count, Sum, Q, Avg, Max, Min
from django.db import transaction
from django.utils import timezone
from datetime import datetime

from .models import GradingSystem, Exam, ExamMark, Student, Subject, StudentClass, AcademicYear, Term, ClassSubjectAssignment
from .serializers import (
    GradingSystemSerializer,
    ExamSerializer,
    ExamMarkSerializer,
    BulkExamMarkSerializer,
    StudentReportCardSerializer,
    ClassPerformanceSerializer,
)


# -------------------- Grading System Management --------------------

class GradingSystemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get grading systems for the school"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                grading_system = GradingSystem.objects.get(id=pk, company=company)
                serializer = GradingSystemSerializer(grading_system)
                return Response({
                    "message": "Grading system retrieved successfully",
                    "grading_system": serializer.data
                })
            except GradingSystem.DoesNotExist:
                return Response({"error": "Grading system not found"}, status=status.HTTP_404_NOT_FOUND)

        # List all grading systems
        grading_systems = GradingSystem.objects.filter(company=company)

        # Filters
        is_default = request.query_params.get('is_default')
        if is_default is not None:
            grading_systems = grading_systems.filter(is_default=is_default.lower() == 'true')

        grading_systems = grading_systems.order_by('-is_default', '-created_at')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(grading_systems, page_size)
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Grading systems fetched successfully",
            "data": GradingSystemSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new grading system"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['company'] = company.id

        # Validate grading scale
        grading_scale = data.get('grading_scale', [])
        if not grading_scale:
            return Response({"error": "Grading scale is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate grading scale format based on type
        grading_type = data.get('grading_type', '8-4-4')
        if grading_type == '8-4-4':
            required_fields = ['min_mark', 'max_mark', 'grade', 'points']
            for grade_rule in grading_scale:
                for field in required_fields:
                    if field not in grade_rule:
                        return Response({"error": f"Each grade rule must have {field}"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = GradingSystemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Grading system created successfully",
                "grading_system": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update a grading system"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grading_system = GradingSystem.objects.get(id=pk, company=company)
        except GradingSystem.DoesNotExist:
            return Response({"error": "Grading system not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['company'] = company.id

        serializer = GradingSystemSerializer(grading_system, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Grading system updated successfully",
                "grading_system": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete a grading system"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grading_system = GradingSystem.objects.get(id=pk, company=company)
            if grading_system.is_default:
                return Response({"error": "Cannot delete default grading system"}, status=status.HTTP_400_BAD_REQUEST)

            grading_system.delete()
            return Response({"message": "Grading system deleted successfully"})
        except GradingSystem.DoesNotExist:
            return Response({"error": "Grading system not found"}, status=status.HTTP_404_NOT_FOUND)


# -------------------- Exam Management --------------------

class ExamAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get exams for the school"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                exam = Exam.objects.get(id=pk, company=company)
                serializer = ExamSerializer(exam)
                return Response({
                    "message": "Exam retrieved successfully",
                    "exam": serializer.data
                })
            except Exam.DoesNotExist:
                return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        # List exams with filters
        exams = Exam.objects.filter(company=company)

        # Filters
        academic_year = request.query_params.get('academic_year')
        term = request.query_params.get('term')
        student_class = request.query_params.get('class')
        exam_type = request.query_params.get('exam_type')
        is_locked = request.query_params.get('is_locked')

        if academic_year:
            exams = exams.filter(academic_year_id=academic_year)
        if term:
            exams = exams.filter(term_id=term)
        if student_class:
            exams = exams.filter(student_class_id=student_class)
        if exam_type:
            exams = exams.filter(exam_type=exam_type)
        if is_locked is not None:
            exams = exams.filter(is_locked=is_locked.lower() == 'true')

        exams = exams.order_by('-exam_date', 'name')

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(exams, page_size)
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Exams fetched successfully",
            "data": ExamSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create a new exam"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['company'] = company.id

        # Set created_by if user has staff profile
        if hasattr(request.user, 'staff'):
            data['created_by'] = request.user.staff.id

        serializer = ExamSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Exam created successfully",
                "exam": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update an exam"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = Exam.objects.get(id=pk, company=company)
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent editing locked exams
        if exam.is_locked:
            return Response({"error": "Cannot modify a locked exam"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['company'] = company.id

        serializer = ExamSerializer(exam, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Exam updated successfully",
                "exam": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete an exam"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = Exam.objects.get(id=pk, company=company)
            if exam.is_locked:
                return Response({"error": "Cannot delete a locked exam"}, status=status.HTTP_400_BAD_REQUEST)

            exam.delete()
            return Response({"message": "Exam deleted successfully"})
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)


class ExamLockAPIView(APIView):
    """API to lock/unlock exams"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Lock or unlock an exam"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = Exam.objects.get(id=pk, company=company)
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action not in ['lock', 'unlock']:
            return Response({"error": "Action must be 'lock' or 'unlock'"}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'lock':
            exam.is_locked = True
            message = "Exam locked successfully"
        else:
            exam.is_locked = False
            message = "Exam unlocked successfully"

        exam.save()
        return Response({"message": message, "exam": ExamSerializer(exam).data})


# -------------------- Exam Marks Management --------------------

class ExamMarkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """Get exam marks"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        if pk:
            try:
                exam_mark = ExamMark.objects.get(id=pk, company=company)
                serializer = ExamMarkSerializer(exam_mark)
                return Response({
                    "message": "Exam mark retrieved successfully",
                    "exam_mark": serializer.data
                })
            except ExamMark.DoesNotExist:
                return Response({"error": "Exam mark not found"}, status=status.HTTP_404_NOT_FOUND)

        # List exam marks with filters
        exam_marks = ExamMark.objects.filter(company=company).select_related(
            'exam', 'student', 'subject', 'entered_by'
        )

        # Filters
        exam_id = request.query_params.get('exam')
        student_id = request.query_params.get('student')
        subject_id = request.query_params.get('subject')
        entered_by = request.query_params.get('entered_by')

        if exam_id:
            exam_marks = exam_marks.filter(exam_id=exam_id)
        if student_id:
            exam_marks = exam_marks.filter(student_id=student_id)
        if subject_id:
            exam_marks = exam_marks.filter(subject_id=subject_id)
        if entered_by:
            exam_marks = exam_marks.filter(entered_by_id=entered_by)

        exam_marks = exam_marks.order_by('student__first_name', 'student__last_name', 'subject__name')

        # Pagination
        page_size = request.query_params.get("pageSize", 50)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 50
            page_number = 1

        paginator = Paginator(exam_marks, page_size)
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Exam marks fetched successfully",
            "data": ExamMarkSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        """Create exam marks"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['company'] = company.id

        # Set entered_by if user has staff profile
        if hasattr(request.user, 'staff'):
            data['entered_by'] = request.user.staff.id

        serializer = ExamMarkSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Exam mark created successfully",
                "exam_mark": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        """Update exam marks"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam_mark = ExamMark.objects.get(id=pk, company=company)
        except ExamMark.DoesNotExist:
            return Response({"error": "Exam mark not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent editing marks for locked exams
        if exam_mark.exam.is_locked:
            return Response({"error": "Cannot modify marks for a locked exam"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['company'] = company.id

        serializer = ExamMarkSerializer(exam_mark, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Exam mark updated successfully",
                "exam_mark": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        """Delete exam marks"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam_mark = ExamMark.objects.get(id=pk, company=company)
            if exam_mark.exam.is_locked:
                return Response({"error": "Cannot delete marks for a locked exam"}, status=status.HTTP_400_BAD_REQUEST)

            exam_mark.delete()
            return Response({"message": "Exam mark deleted successfully"})
        except ExamMark.DoesNotExist:
            return Response({"error": "Exam mark not found"}, status=status.HTTP_404_NOT_FOUND)


class BulkExamMarkAPIView(APIView):
    """API for bulk marks entry"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Bulk create/update exam marks"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        exam_id = data.get('exam_id')
        subject_id = data.get('subject_id')
        marks_data = data.get('marks_data', [])

        if not all([exam_id, subject_id, marks_data]):
            return Response({"error": "exam_id, subject_id, and marks_data are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate exam and subject belong to company
        try:
            exam = Exam.objects.get(id=exam_id, company=company)
            subject = Subject.objects.get(id=subject_id, company=company)
        except (Exam.DoesNotExist, Subject.DoesNotExist):
            return Response({"error": "Invalid exam or subject"}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent bulk entry for locked exams
        if exam.is_locked:
            return Response({"error": "Cannot modify marks for a locked exam"}, status=status.HTTP_400_BAD_REQUEST)

        created_marks = []
        updated_marks = []
        errors = []

        with transaction.atomic():
            for mark_data in marks_data:
                student_id = mark_data.get('student_id')
                marks_obtained = mark_data.get('marks_obtained')
                cbc_level = mark_data.get('cbc_level')
                teacher_remarks = mark_data.get('teacher_remarks', '')
                is_absent = mark_data.get('is_absent', False)

                try:
                    student = Student.objects.get(id=student_id, company=company)

                    # Validate student is in the exam's class
                    if exam.student_class and student.student_class != exam.student_class:
                        errors.append(f"Student {student.get_full_name()} is not in the exam's class")
                        continue

                    # Validate subject is assigned to student's class
                    if not ClassSubjectAssignment.objects.filter(
                        student_class=student.student_class,
                        subject=subject,
                        academic_year=exam.academic_year
                    ).exists():
                        errors.append(f"Subject {subject.name} is not assigned to {student.get_full_name()}'s class")
                        continue

                    # Create or update exam mark
                    exam_mark, created = ExamMark.objects.get_or_create(
                        exam=exam,
                        student=student,
                        subject=subject,
                        defaults={
                            'company': company,
                            'marks_obtained': marks_obtained,
                            'cbc_level': cbc_level,
                            'teacher_remarks': teacher_remarks,
                            'is_absent': is_absent,
                            'entered_by': request.user.staff if hasattr(request.user, 'staff') else None
                        }
                    )

                    if not created:
                        exam_mark.marks_obtained = marks_obtained
                        exam_mark.cbc_level = cbc_level
                        exam_mark.teacher_remarks = teacher_remarks
                        exam_mark.is_absent = is_absent
                        exam_mark.entered_by = request.user.staff if hasattr(request.user, 'staff') else None
                        exam_mark.save()
                        updated_marks.append(exam_mark)
                    else:
                        created_marks.append(exam_mark)

                except Student.DoesNotExist:
                    errors.append(f"Student with ID {student_id} not found")
                    continue
                except Exception as e:
                    errors.append(f"Error processing mark for student {student_id}: {str(e)}")
                    continue

        return Response({
            "message": f"Bulk marks entry completed. Created: {len(created_marks)}, Updated: {len(updated_marks)}, Errors: {len(errors)}",
            "created": len(created_marks),
            "updated": len(updated_marks),
            "errors": errors
        })


# -------------------- Reports and Analytics --------------------

class StudentReportCardAPIView(APIView):
    """API for generating student report cards"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Generate report card for a student"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        student_id = request.query_params.get('student_id')
        term_id = request.query_params.get('term_id')
        academic_year_id = request.query_params.get('academic_year_id')

        if not all([student_id, term_id, academic_year_id]):
            return Response({"error": "student_id, term_id, and academic_year_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(id=student_id, company=company)
            term = Term.objects.get(id=term_id, academic_year_id=academic_year_id, academic_year__company=company)
        except (Student.DoesNotExist, Term.DoesNotExist):
            return Response({"error": "Invalid student or term"}, status=status.HTTP_404_NOT_FOUND)

        # Get all exams for this term
        exams = Exam.objects.filter(
            company=company,
            academic_year_id=academic_year_id,
            term=term,
            is_active=True
        )

        # Get all marks for this student in these exams
        exam_marks = ExamMark.objects.filter(
            exam__in=exams,
            student=student
        ).select_related('exam', 'subject')

        # Prepare data for serializer
        instance_data = {
            'student': student,
            'exam_marks': exam_marks,
            'term': term
        }

        serializer = StudentReportCardSerializer(instance_data)
        return Response(serializer.data)


class ClassPerformanceAPIView(APIView):
    """API for class performance analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Generate class performance report"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        class_id = request.query_params.get('class_id')
        term_id = request.query_params.get('term_id')
        academic_year_id = request.query_params.get('academic_year_id')

        if not all([class_id, term_id, academic_year_id]):
            return Response({"error": "class_id, term_id, and academic_year_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_class = StudentClass.objects.get(id=class_id, company=company, academic_year_id=academic_year_id)
            term = Term.objects.get(id=term_id, academic_year_id=academic_year_id, academic_year__company=company)
        except (StudentClass.DoesNotExist, Term.DoesNotExist):
            return Response({"error": "Invalid class or term"}, status=status.HTTP_404_NOT_FOUND)

        # Get all exams for this class and term
        exams = Exam.objects.filter(
            company=company,
            academic_year_id=academic_year_id,
            term=term,
            is_active=True
        ).filter(
            Q(student_class=student_class) | Q(student_class__isnull=True)  # Include whole school exams
        )

        # Get all marks for these exams
        exam_marks = ExamMark.objects.filter(
            exam__in=exams
        ).select_related('exam', 'student', 'subject')

        # Prepare data for serializer
        instance_data = {
            'student_class': student_class,
            'exam_marks': exam_marks
        }

        serializer = ClassPerformanceSerializer(instance_data)
        return Response(serializer.data)


class ExamStatisticsAPIView(APIView):
    """API for exam statistics and insights"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get exam statistics"""
        company = request.company
        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({"error": "exam_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = Exam.objects.get(id=exam_id, company=company)
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get marks statistics
        marks_stats = ExamMark.objects.filter(exam=exam).aggregate(
            total_marks=Sum('marks_obtained'),
            average_mark=Avg('marks_obtained'),
            highest_mark=Max('marks_obtained'),
            lowest_mark=Min('marks_obtained'),
            count=Count('id')
        )

        # Grade distribution
        grade_distribution = ExamMark.objects.filter(exam=exam).values('grade').annotate(
            count=Count('id')
        ).order_by('grade')

        # Subject performance
        subject_performance = ExamMark.objects.filter(exam=exam).values(
            'subject__name', 'subject__code'
        ).annotate(
            average_mark=Avg('marks_obtained'),
            highest_mark=Max('marks_obtained'),
            lowest_mark=Min('marks_obtained'),
            pass_count=Count('id', filter=Q(marks_obtained__gte=50)),  # Assuming 50 is pass mark
            total_count=Count('id')
        ).order_by('subject__name')

        # Student performance summary
        student_performance = ExamMark.objects.filter(exam=exam).values(
            'student__first_name', 'student__last_name', 'student__admission_number'
        ).annotate(
            total_marks=Sum('marks_obtained'),
            average_mark=Avg('marks_obtained'),
            subject_count=Count('id')
        ).order_by('-average_mark')

        return Response({
            'exam': ExamSerializer(exam).data,
            'statistics': {
                'total_marks': marks_stats['total_marks'] or 0,
                'average_mark': round(marks_stats['average_mark'] or 0, 2),
                'highest_mark': marks_stats['highest_mark'] or 0,
                'lowest_mark': marks_stats['lowest_mark'] or 0,
                'total_entries': marks_stats['count'] or 0,
                'grade_distribution': list(grade_distribution),
                'subject_performance': list(subject_performance),
                'top_performers': list(student_performance)[:10]  # Top 10 students
            }
        })
