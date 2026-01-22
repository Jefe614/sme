"""
Teacher Attendance APIs

This module provides mobile-ready APIs for teachers to record student attendance.
- Teachers: Can mark and edit same-day attendance for their assigned classes
- APIs are designed for both web and mobile use

All validation and business logic is handled here, with serializers only returning JSON responses.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime
from django.utils import timezone

from core.models import Attendance, Student, StudentClass, Staff, AcademicYear, Term
from core.serializers import AttendanceSerializer


class TeacherPermissionMixin:
    """
    Mixin to enforce teacher-specific permissions for attendance operations.
    """

    def get_staff_from_user(self, request):
        """Get staff record associated with the current user"""
        try:
            # In this system, we need to match user to staff via email or username
            # For mobile API, staff_id should be passed in request
            staff_id = request.query_params.get('staff_id') or request.data.get('staff_id')

            if staff_id:
                staff = Staff.objects.get(id=staff_id, company=request.company, is_active=True)
                return staff

            return None
        except Staff.DoesNotExist:
            return None

    def is_teacher(self, staff):
        """Check if staff member is a teacher"""
        if not staff:
            return False
        return staff.staff_type == 'teaching' or staff.staff_role == 'teacher'

    def can_mark_attendance(self, request):
        """Check if user can mark/edit attendance (teacher only)"""
        staff = self.get_staff_from_user(request)
        return self.is_teacher(staff)

    def validate_teacher_class_access(self, request, class_id):
        """Validate that teacher has access to the specified class"""
        staff = self.get_staff_from_user(request)
        if not staff:
            return False, "Staff not found"

        # Check if teacher is assigned to this class or is a class teacher
        try:
            student_class = StudentClass.objects.get(id=class_id, company=request.company)
        except StudentClass.DoesNotExist:
            return False, "Class not found"

        # Class teacher has access
        if student_class.class_teacher == staff:
            return True, None

        # Teachers assigned to subjects in this class have access
        if student_class.classes_taught.filter(id=staff.id).exists():
            return True, None

        return False, "Teacher does not have access to this class"


class AttendanceMarkingAPIView(APIView, TeacherPermissionMixin):
    """
    API for teachers to mark attendance for their classes.

    POST: Mark attendance for students in a class
    PUT: Update attendance record (same-day only)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Mark attendance for students.

        Request body:
        {
            "date": "2024-01-22",
            "class_id": 1,
            "academic_year_id": 1,
            "term_id": 1,
            "staff_id": 1,  // Teacher marking attendance
            "attendance_records": [
                {"student_id": 1, "status": "present", "remarks": ""},
                {"student_id": 2, "status": "absent", "reason": "Sick"},
                ...
            ]
        }
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is a teacher
        if not self.can_mark_attendance(request):
            return Response(
                {"error": "Only teachers can mark attendance"},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data

        # Validate required fields
        required_fields = ['date', 'class_id', 'academic_year_id', 'term_id', 'staff_id', 'attendance_records']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response(
                {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse date
        try:
            attendance_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate teacher has access to the class
        has_access, error_msg = self.validate_teacher_class_access(request, data['class_id'])
        if not has_access:
            return Response(
                {"error": error_msg},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate entities
        try:
            student_class = StudentClass.objects.get(id=data['class_id'], company=company)
            academic_year = AcademicYear.objects.get(id=data['academic_year_id'], company=company)
            term = Term.objects.get(id=data['term_id'], academic_year=academic_year)
            marked_by = Staff.objects.get(id=data['staff_id'], company=company)
        except StudentClass.DoesNotExist:
            return Response({"error": "Invalid class ID"}, status=status.HTTP_400_BAD_REQUEST)
        except AcademicYear.DoesNotExist:
            return Response({"error": "Invalid academic year ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Term.DoesNotExist:
            return Response({"error": "Invalid term ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Staff.DoesNotExist:
            return Response({"error": "Invalid staff ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update attendance records
        created_records = []
        updated_records = []
        errors = []

        for record in data['attendance_records']:
            if 'student_id' not in record or 'status' not in record:
                errors.append(f"Missing student_id or status in record")
                continue

            try:
                student = Student.objects.get(id=record['student_id'], company=company)

                # Validate student is in the specified class
                if student.student_class != student_class:
                    errors.append(f"Student {record['student_id']} is not in the specified class")
                    continue

                # Check if attendance already exists
                attendance, created = Attendance.objects.update_or_create(
                    company=company,
                    student=student,
                    student_class=student_class,
                    date=attendance_date,
                    academic_year=academic_year,
                    term=term,
                    defaults={
                        'status': record['status'],
                        'remarks': record.get('remarks', ''),
                        'reason': record.get('reason', ''),
                        'marked_by': marked_by,
                        'marked_at': timezone.now()
                    }
                )

                if created:
                    created_records.append(attendance)
                else:
                    updated_records.append(attendance)

            except Student.DoesNotExist:
                errors.append(f"Student with ID {record['student_id']} not found")
            except Exception as e:
                errors.append(f"Error processing student {record.get('student_id')}: {str(e)}")

        response_data = {
            "message": "Attendance marked successfully",
            "created": len(created_records),
            "updated": len(updated_records),
            "errors": errors
        }

        if created_records or updated_records:
            response_data["records"] = AttendanceSerializer(
                created_records + updated_records, many=True
            ).data

        return Response(response_data, status=status.HTTP_201_CREATED)

    def put(self, request, pk=None):
        """
        Update a specific attendance record.
        Teachers can only edit same-day attendance.
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is a teacher
        if not self.can_mark_attendance(request):
            return Response(
                {"error": "Only teachers can edit attendance"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            attendance = Attendance.objects.get(id=pk, company=company)
        except Attendance.DoesNotExist:
            return Response(
                {"error": "Attendance record not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if teacher has access to the class
        has_access, error_msg = self.validate_teacher_class_access(request, attendance.student_class.id)
        if not has_access:
            return Response(
                {"error": error_msg},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if editing same-day attendance only
        today = timezone.now().date()
        if attendance.date != today:
            return Response(
                {"error": "You can only edit today's attendance records"},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data

        # Update fields
        if 'status' in data:
            attendance.status = data['status']
        if 'remarks' in data:
            attendance.remarks = data['remarks']
        if 'reason' in data:
            attendance.reason = data['reason']

        # Update marked_by and marked_at
        staff_id = data.get('staff_id') or request.query_params.get('staff_id')
        if staff_id:
            try:
                marked_by = Staff.objects.get(id=staff_id, company=company)
                attendance.marked_by = marked_by
            except Staff.DoesNotExist:
                pass

        attendance.marked_at = timezone.now()
        attendance.save()

        return Response({
            "message": "Attendance updated successfully",
            "attendance": AttendanceSerializer(attendance).data
        })


class ClassAttendanceDataAPIView(APIView, TeacherPermissionMixin):
    """
    Get class attendance data for marking.
    Designed for teacher mobile and web use.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get students in a class for attendance marking.

        Query params:
        - class_id: Class ID (required)
        - date: Date for attendance (default: today)
        - staff_id: Teacher staff ID (required)
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response(
                {"error": "class_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check teacher access
        has_access, error_msg = self.validate_teacher_class_access(request, class_id)
        if not has_access:
            return Response(
                {"error": error_msg},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student_class = StudentClass.objects.get(id=class_id, company=company)
        except StudentClass.DoesNotExist:
            return Response(
                {"error": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get date
        date_param = request.query_params.get('date')
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.now().date()

        # Get students in class
        students = Student.objects.filter(
            student_class=student_class,
            company=company,
            is_active=True
        ).order_by('first_name', 'last_name')

        # Get existing attendance for the date
        existing_attendance = Attendance.objects.filter(
            company=company,
            student_class=student_class,
            date=target_date
        )

        attendance_dict = {att.student_id: att for att in existing_attendance}

        # Build response with students and their attendance status
        student_list = []
        for student in students:
            attendance = attendance_dict.get(student.id)
            student_list.append({
                "id": student.id,
                "name": student.get_full_name(),
                "admission_number": student.admission_number,
                "attendance": AttendanceSerializer(attendance).data if attendance else None
            })

        return Response({
            "message": "Class attendance data fetched successfully",
            "class": {
                "id": student_class.id,
                "name": student_class.name,
                "grade_level": student_class.grade_level,
                "section": student_class.section
            },
            "date": target_date.strftime('%Y-%m-%d'),
            "students": student_list,
            "total_students": len(student_list)
        })


class TeacherClassesAPIView(APIView, TeacherPermissionMixin):
    """
    Get classes assigned to a teacher for attendance marking.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get classes that a teacher can mark attendance for.

        Query params:
        - staff_id: Teacher staff ID (required)
        - academic_year_id: Filter by academic year (optional)
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        staff_id = request.query_params.get('staff_id')
        if not staff_id:
            return Response(
                {"error": "staff_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            staff = Staff.objects.get(id=staff_id, company=company, is_active=True)
        except Staff.DoesNotExist:
            return Response(
                {"error": "Staff not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if staff is a teacher
        if not self.is_teacher(staff):
            return Response(
                {"error": "Only teachers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get classes where teacher is class teacher or teaches subjects
        classes = StudentClass.objects.filter(
            Q(class_teacher=staff) | Q(classes_taught=staff),
            company=company,
            is_active=True
        ).distinct()

        # Apply academic year filter if provided
        academic_year_id = request.query_params.get('academic_year_id')
        if academic_year_id:
            classes = classes.filter(academic_year_id=academic_year_id)

        # Build response
        class_list = []
        for student_class in classes:
            class_list.append({
                "id": student_class.id,
                "name": student_class.name,
                "grade_level": student_class.grade_level,
                "section": student_class.section,
                "academic_year": {
                    "id": student_class.academic_year.id,
                    "name": student_class.academic_year.name
                },
                "is_class_teacher": student_class.class_teacher == staff,
                "student_count": student_class.students.filter(is_active=True).count()
            })

        return Response({
            "message": "Teacher classes fetched successfully",
            "teacher": {
                "id": staff.id,
                "name": staff.full_name,
                "staff_id": staff.staff_id
            },
            "classes": class_list,
            "total_classes": len(class_list)
        })
