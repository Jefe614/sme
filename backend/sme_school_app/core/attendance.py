"""
Attendance Management Module - Admin View APIs

This module provides admin-only APIs for viewing attendance data, dashboards, and reports.
- Admins: Read-only access to view attendance data, dashboards, summaries, and exports
- All APIs are read-only for admin users

The APIs are designed to support web admin dashboards.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg
from django.core.paginator import Paginator, EmptyPage
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.http import HttpResponse
import csv

from .models import Attendance, Student, StudentClass, Staff, AcademicYear, Term
from .serializers import AttendanceSerializer, AttendanceSummarySerializer


class AttendancePermissionMixin:
    """
    Mixin to enforce role-based permissions for attendance operations.

    Role enforcement:
    - Only teachers (staff with staff_role='teacher' or staff_type='teaching') can mark/edit attendance
    - Admins have read-only access
    """

    def get_staff_from_user(self, request):
        """Get staff record associated with the current user"""
        try:
            # In this system, we need to match user to staff via email or username
            # For now, we'll use a query parameter or staff_id in session
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

    def can_view_attendance(self, request):
        """Check if user can view attendance (all authenticated users)"""
        return True  # All authenticated users can view


class AttendanceDashboardAPIView(APIView, AttendancePermissionMixin):
    """
    Dashboard API for attendance statistics and summaries.
    Available to all authenticated users (read-only for admins).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get attendance dashboard statistics.

        Query params:
        - date: Specific date (default: today)
        - start_date: Start date for range
        - end_date: End date for range
        - class_id: Filter by class
        - academic_year_id: Filter by academic year
        - term_id: Filter by term
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get date range
        date_param = request.query_params.get('date')
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                start_date = target_date
                end_date = target_date
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date_param = request.query_params.get('start_date')
            end_date_param = request.query_params.get('end_date')

            if start_date_param and end_date_param:
                try:
                    start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {"error": "Invalid date format. Use YYYY-MM-DD"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Default to today
                start_date = end_date = timezone.now().date()

        # Build query
        attendance_query = Attendance.objects.filter(
            company=company,
            date__gte=start_date,
            date__lte=end_date
        )

        # Apply filters
        class_id = request.query_params.get('class_id')
        if class_id:
            attendance_query = attendance_query.filter(student_class_id=class_id)

        academic_year_id = request.query_params.get('academic_year_id')
        if academic_year_id:
            attendance_query = attendance_query.filter(academic_year_id=academic_year_id)

        term_id = request.query_params.get('term_id')
        if term_id:
            attendance_query = attendance_query.filter(term_id=term_id)

        # Calculate statistics
        total_records = attendance_query.count()
        status_breakdown = attendance_query.values('status').annotate(count=Count('id'))

        # Convert to dictionary
        status_counts = {item['status']: item['count'] for item in status_breakdown}

        # Get class-wise breakdown
        class_breakdown = attendance_query.values(
            'student_class__id',
            'student_class__name',
            'student_class__grade_level',
            'student_class__section'
        ).annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            absent=Count('id', filter=Q(status='absent')),
            late=Count('id', filter=Q(status='late')),
            excused=Count('id', filter=Q(status='excused'))
        )

        # Calculate attendance rate
        present_count = status_counts.get('present', 0)
        attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0

        return Response({
            "message": "Dashboard statistics fetched successfully",
            "date_range": {
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d')
            },
            "summary": {
                "total_records": total_records,
                "present": status_counts.get('present', 0),
                "absent": status_counts.get('absent', 0),
                "late": status_counts.get('late', 0),
                "excused": status_counts.get('excused', 0),
                "attendance_rate": round(attendance_rate, 2)
            },
            "class_breakdown": list(class_breakdown)
        })


class AttendanceReportAPIView(APIView, AttendancePermissionMixin):
    """
    Generate attendance reports for export.
    Available to all authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Generate attendance report.

        Query params:
        - format: csv or json (default: json)
        - start_date: Start date (required)
        - end_date: End date (required)
        - class_id: Filter by class (optional)
        - student_id: Filter by student (optional)
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate required date range
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')

        if not start_date_param or not end_date_param:
            return Response(
                {"error": "start_date and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build query
        attendance_query = Attendance.objects.filter(
            company=company,
            date__gte=start_date,
            date__lte=end_date
        ).select_related('student', 'student_class', 'marked_by')

        # Apply filters
        class_id = request.query_params.get('class_id')
        if class_id:
            attendance_query = attendance_query.filter(student_class_id=class_id)

        student_id = request.query_params.get('student_id')
        if student_id:
            attendance_query = attendance_query.filter(student_id=student_id)

        # Order by date and student
        attendance_query = attendance_query.order_by('date', 'student__first_name', 'student__last_name')

        # Check format
        export_format = request.query_params.get('format', 'json').lower()

        if export_format == 'csv':
            return self._export_csv(attendance_query, start_date, end_date)
        else:
            return self._export_json(attendance_query, start_date, end_date)

    def _export_csv(self, queryset, start_date, end_date):
        """Export attendance data as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_report_{start_date}_to_{end_date}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Date', 'Student Name', 'Admission Number', 'Class',
            'Status', 'Reason', 'Remarks', 'Marked By', 'Marked At'
        ])

        for record in queryset:
            writer.writerow([
                record.date.strftime('%Y-%m-%d'),
                record.student.get_full_name(),
                record.student.admission_number,
                record.student_class.name if record.student_class else '',
                record.get_status_display(),
                record.reason or '',
                record.remarks or '',
                record.marked_by.full_name if record.marked_by else '',
                record.marked_at.strftime('%Y-%m-%d %H:%M:%S') if record.marked_at else ''
            ])

        return response

    def _export_json(self, queryset, start_date, end_date):
        """Export attendance data as JSON"""
        return Response({
            "message": "Attendance report generated successfully",
            "date_range": {
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d')
            },
            "total_records": queryset.count(),
            "data": AttendanceSerializer(queryset, many=True).data
        })


class StudentAttendanceSummaryAPIView(APIView, AttendancePermissionMixin):
    """
    Get attendance summary for individual students.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        """
        Get attendance summary for a specific student.

        Query params:
        - academic_year_id: Filter by academic year (optional)
        - term_id: Filter by term (optional)
        - start_date: Start date (optional)
        - end_date: End date (optional)
        """
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response(
                {"error": "Tenant must be a school company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate student
        try:
            student = Student.objects.get(id=student_id, company=company)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Build query
        attendance_query = Attendance.objects.filter(
            company=company,
            student=student
        )

        # Apply filters
        academic_year_id = request.query_params.get('academic_year_id')
        if academic_year_id:
            attendance_query = attendance_query.filter(academic_year_id=academic_year_id)

        term_id = request.query_params.get('term_id')
        if term_id:
            attendance_query = attendance_query.filter(term_id=term_id)

        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                attendance_query = attendance_query.filter(date__gte=start)
            except ValueError:
                pass

        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                attendance_query = attendance_query.filter(date__lte=end)
            except ValueError:
                pass

        # Calculate statistics
        total_records = attendance_query.count()
        status_breakdown = attendance_query.values('status').annotate(count=Count('id'))
        status_counts = {item['status']: item['count'] for item in status_breakdown}

        # Calculate attendance rate
        present_count = status_counts.get('present', 0)
        attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0

        # Get recent attendance records
        recent_records = attendance_query.order_by('-date')[:10]

        return Response({
            "message": "Student attendance summary fetched successfully",
            "student": {
                "id": student.id,
                "name": student.get_full_name(),
                "admission_number": student.admission_number,
                "class": student.student_class.name if student.student_class else None
            },
            "summary": {
                "total_records": total_records,
                "present": status_counts.get('present', 0),
                "absent": status_counts.get('absent', 0),
                "late": status_counts.get('late', 0),
                "excused": status_counts.get('excused', 0),
                "attendance_rate": round(attendance_rate, 2)
            },
            "recent_records": AttendanceSerializer(recent_records, many=True).data
        })
