import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.hashers import check_password, make_password
from django_tenants.utils import tenant_context
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from rest_framework.authtoken.models import Token

from tenants.models import Company
from core.models import Student, FeePayment, Attendance, Exam, ExamMark, Notification
from core.sms_utils import send_otp_sms
from .models import Parent
from .serializers import (
    ParentSerializer, ParentDashboardSerializer, ParentStudentSerializer,
    ParentFeeSerializer, ParentExamResultSerializer, ParentAttendanceSerializer,
    ParentNotificationSerializer
)


class ParentSendOTPAPIView(APIView):
    """
    Send OTP to parent's phone number
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone_number = request.data.get("phone_number", "").strip()
        schema_name = request.data.get("schema", "").strip()

        if not schema_name:
            return Response({"error": "Company schema is required"}, status=400)

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=400)

        try:
            company = Company.objects.get(schema_name=schema_name, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "Invalid school"}, status=400)

        with tenant_context(company):
            try:
                parent = Parent.objects.get(phone_number=phone_number, is_active=True)
                print("parent", parent)
            except Parent.DoesNotExist:
                return Response({"error": "Parent not found or not registered"}, status=400)

            # Generate and send OTP
            otp = parent.generate_otp()

            # Send OTP via SMS
            school_name = company.name  # Use company name as school name
            sms_result = send_otp_sms(phone_number, otp, school_name)

            if sms_result['success']:
                return Response({
                    "message": "OTP sent successfully to your phone"
                }, status=200)
            else:
                # If SMS fails, still allow login with OTP shown (for testing)
                # In production, you might want to handle this differently
                print(f"SMS failed, OTP for {phone_number}: {otp}")  # Remove in production
                return Response({
                    "message": "OTP sent successfully",
                    "otp": otp,  # Remove this in production - only for testing
                    "warning": "SMS delivery may be delayed"
                }, status=200)


class ParentVerifyOTPAPIView(APIView):
    """
    Verify OTP and return authentication token
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone_number = request.data.get("phone_number", "").strip()
        otp_code = request.data.get("otp_code", "").strip()
        schema_name = request.data.get("schema", "").strip()

        if not schema_name:
            return Response({"error": "Company schema is required"}, status=400)

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=400)

        if not otp_code:
            return Response({"error": "OTP code is required"}, status=400)

        try:
            company = Company.objects.get(schema_name=schema_name, company_type="SCHOOL")
        except Company.DoesNotExist:
            return Response({"error": "Invalid school"}, status=400)

        with tenant_context(company):
            try:
                parent = Parent.objects.get(phone_number=phone_number, is_active=True)
            except Parent.DoesNotExist:
                return Response({"error": "Parent not found"}, status=404)

            token = parent.verify_otp(otp_code)
            if token:
                return Response({
                    "message": "Login successful",
                    "token": token,
                    "parent": ParentSerializer(parent).data,
                    "school_name": company.name
                }, status=200)
            else:
                return Response({"error": "Invalid or expired OTP"}, status=400)


class ParentDashboardAPIView(APIView):
    """
    Parent dashboard showing overview of all linked students
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        # Get current tenant/company information
        from django.db import connection
        current_schema = connection.schema_name
        try:
            company = Company.objects.get(schema_name=current_schema, company_type="SCHOOL")
            school_name = company.name
        except Company.DoesNotExist:
            school_name = "School"

        students_data = []

        for student in parent.linked_students.all():
            # Calculate fee balance
            fee_balance = FeePayment.objects.filter(
                student=student,
                payment_status='completed'
            ).aggregate(
                total_paid=Sum('amount_paid'),
                total_due=Sum('due_amount')
            )

            balance = (fee_balance.get('total_due', 0) or 0) - (fee_balance.get('total_paid', 0) or 0)

            # Calculate attendance percentage
            attendance_stats = Attendance.objects.filter(
                student=student,
                academic_year=student.student_class.academic_year if student.student_class else None
            ).aggregate(
                total_days=Count('id'),
                present_days=Count('id', filter=Q(status='present'))
            )

            attendance_percentage = 0
            if attendance_stats['total_days'] > 0:
                attendance_percentage = (attendance_stats['present_days'] / attendance_stats['total_days']) * 100

            # Get latest exam result
            latest_exam = ExamMark.objects.filter(
                student=student
            ).select_related('exam', 'subject').order_by('-exam__exam_date').first()

            latest_result = None
            if latest_exam:
                latest_result = {
                    'exam_name': latest_exam.exam.name,
                    'subject': latest_exam.subject.name,
                    'marks': latest_exam.marks_obtained,
                    'grade': latest_exam.grade
                }

            # Get performance data for charts (last 6 exams per subject)
            performance_data = []
            subject_performance = {}

            # Get all exam marks for this student (last 6 months)
            recent_exams = ExamMark.objects.filter(
                student=student,
                is_absent=False,
                exam__exam_date__gte=timezone.now() - timezone.timedelta(days=180)
            ).select_related('exam', 'subject').order_by('exam__exam_date')

            for mark in recent_exams:
                subject_name = mark.subject.name
                if subject_name not in subject_performance:
                    subject_performance[subject_name] = []

                subject_performance[subject_name].append({
                    'exam_date': mark.exam.exam_date.strftime('%Y-%m-%d'),
                    'exam_name': mark.exam.name,
                    'marks': mark.marks_obtained or 0,
                    'grade': mark.grade or '',
                    'subject': subject_name
                })

            # Convert to chart-friendly format
            for subject, marks in subject_performance.items():
                performance_data.append({
                    'subject': subject,
                    'data': marks[-6:]  # Last 6 exams max
                })

            # Get attendance data for charts (last 3 months)
            attendance_records = Attendance.objects.filter(
                student=student,
                date__gte=timezone.now() - timezone.timedelta(days=90)
            ).order_by('date')

            attendance_data = []
            monthly_attendance = {}

            for record in attendance_records:
                month_key = record.date.strftime('%Y-%m')
                if month_key not in monthly_attendance:
                    monthly_attendance[month_key] = {
                        'month': record.date.strftime('%b %Y'),
                        'total_days': 0,
                        'present_days': 0,
                        'absent_days': 0
                    }

                monthly_attendance[month_key]['total_days'] += 1
                if record.status == 'present':
                    monthly_attendance[month_key]['present_days'] += 1
                else:
                    monthly_attendance[month_key]['absent_days'] += 1

            # Convert monthly data to array and calculate percentages
            for month_data in monthly_attendance.values():
                attendance_data.append({
                    'month': month_data['month'],
                    'present': month_data['present_days'],
                    'absent': month_data['absent_days'],
                    'total': month_data['total_days'],
                    'attendance_percentage': round((month_data['present_days'] / month_data['total_days']) * 100, 1) if month_data['total_days'] > 0 else 0
                })

            # Sort by month
            attendance_data.sort(key=lambda x: x['month'])

            # Get latest announcement
            latest_announcement = Notification.objects.filter(
                Q(student=student) | Q(student__isnull=True),
                created_at__gte=timezone.now() - timezone.timedelta(days=30)
            ).order_by('-created_at').first()

            announcement_data = None
            if latest_announcement:
                announcement_data = {
                    'subject': latest_announcement.subject,
                    'message': latest_announcement.message[:100] + '...' if len(latest_announcement.message) > 100 else latest_announcement.message
                }

            # Add mock chart data if no real chart data exists
            if not performance_data:
                performance_data = get_mock_performance_data()
            if not attendance_data:
                attendance_data = get_mock_monthly_attendance_data()

            students_data.append({
                'student_name': f"{student.first_name} {student.last_name}",
                'class_name': student.student_class.name if student.student_class else "Not Assigned",
                'admission_number': student.admission_number,
                'fee_balance': balance,
                'attendance_percentage': round(attendance_percentage, 1),
                'latest_exam_result': latest_result,
                'latest_announcement': announcement_data,
                'performance_data': performance_data,
                'attendance_data': attendance_data
            })

        return Response({
            'school_name': school_name,
            'students': students_data
        }, status=200)


def get_mock_student_data():
    """Generate mock data for demonstration purposes"""
    import random
    from datetime import datetime, timedelta

    # Mock students
    students = [
        {
            'student_name': 'John Maina',
            'class_name': 'Grade 8A',
            'admission_number': 'STU001',
            'fee_balance': 1500.00,
            'attendance_percentage': 92.5,
            'latest_exam_result': {
                'exam_name': 'End Term Exam',
                'subject': 'Mathematics',
                'marks': 85,
                'grade': 'A-'
            },
            'latest_announcement': 'School will close for holidays starting December 20th. Report back on January 3rd.',
            'performance_data': [],
            'attendance_data': []
        },
        {
            'student_name': 'Grace Wanjiku',
            'class_name': 'Grade 7B',
            'admission_number': 'STU002',
            'fee_balance': 750.00,
            'attendance_percentage': 88.3,
            'latest_exam_result': {
                'exam_name': 'CAT 2',
                'subject': 'English',
                'marks': 78,
                'grade': 'B+'
            },
            'latest_announcement': 'Parent-teacher meeting scheduled for November 25th at 2 PM.',
            'performance_data': [],
            'attendance_data': []
        }
    ]

    # Generate mock performance data
    subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'CRE', 'Art']
    exam_types = ['CAT 1', 'CAT 2', 'Mid Term', 'CAT 3', 'End Term']

    for student in students:
        student_performance = []

        for subject in subjects[:4]:  # 4 subjects per student
            subject_data = []
            base_mark = random.randint(65, 95)  # Base performance level

            for i, exam in enumerate(exam_types):
                # Add some variation to marks
                variation = random.randint(-8, 8)
                mark = max(0, min(100, base_mark + variation))

                # Calculate grade
                if mark >= 80:
                    grade = 'A'
                elif mark >= 75:
                    grade = 'A-'
                elif mark >= 70:
                    grade = 'B+'
                elif mark >= 65:
                    grade = 'B'
                elif mark >= 60:
                    grade = 'B-'
                elif mark >= 55:
                    grade = 'C+'
                elif mark >= 50:
                    grade = 'C'
                else:
                    grade = 'D'

                subject_data.append({
                    'exam_date': (datetime.now() - timedelta(days=(len(exam_types)-i-1)*30)).strftime('%Y-%m-%d'),
                    'exam_name': exam,
                    'marks': mark,
                    'grade': grade,
                    'subject': subject
                })

            student_performance.append({
                'subject': subject,
                'data': subject_data[-6:]  # Last 6 exams
            })

        student['performance_data'] = student_performance

    # Generate mock attendance data
    months = ['Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024']

    for student in students:
        attendance_data = []

        for month in months:
            # Simulate realistic attendance (80-95%)
            total_days = random.randint(18, 22)  # School days in month
            attendance_rate = random.uniform(0.82, 0.95)
            present_days = int(total_days * attendance_rate)
            absent_days = total_days - present_days

            attendance_data.append({
                'month': month,
                'present': present_days,
                'absent': absent_days,
                'total': total_days,
                'attendance_percentage': round(attendance_rate * 100, 1)
            })

        student['attendance_data'] = attendance_data

    return students


def get_mock_performance_data():
    """Generate mock performance data for charts"""
    import random
    from datetime import datetime, timedelta

    subjects = ['Mathematics', 'English', 'Science', 'Social Studies']
    exam_types = ['CAT 1', 'CAT 2', 'Mid Term', 'CAT 3', 'End Term']

    performance_data = []

    for subject in subjects:
        subject_data = []
        base_mark = random.randint(65, 95)  # Base performance level

        for i, exam in enumerate(exam_types):
            # Add some variation to marks
            variation = random.randint(-8, 8)
            mark = max(0, min(100, base_mark + variation))

            # Calculate grade
            if mark >= 80:
                grade = 'A'
            elif mark >= 75:
                grade = 'A-'
            elif mark >= 70:
                grade = 'B+'
            elif mark >= 65:
                grade = 'B'
            elif mark >= 60:
                grade = 'B-'
            elif mark >= 55:
                grade = 'C+'
            elif mark >= 50:
                grade = 'C'
            else:
                grade = 'D'

            subject_data.append({
                'exam_date': (datetime.now() - timedelta(days=(len(exam_types)-i-1)*30)).strftime('%Y-%m-%d'),
                'exam_name': exam,
                'marks': mark,
                'grade': grade,
                'subject': subject
            })

        performance_data.append({
            'subject': subject,
            'data': subject_data[-6:]  # Last 6 exams max
        })

    return performance_data


def get_mock_monthly_attendance_data():
    """Generate mock monthly attendance data for charts"""
    import random

    months = ['Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024']

    attendance_data = []

    for month in months:
        # Simulate realistic attendance (80-95%)
        total_days = random.randint(18, 22)  # School days in month
        attendance_rate = random.uniform(0.82, 0.95)
        present_days = int(total_days * attendance_rate)
        absent_days = total_days - present_days

        attendance_data.append({
            'month': month,
            'present': present_days,
            'absent': absent_days,
            'total': total_days,
            'attendance_percentage': round(attendance_rate * 100, 1)
        })

    return attendance_data


def get_mock_students_data():
    """Return simplified student data for other APIs"""
    return [
        {
            'id': 1,
            'first_name': 'John',
            'last_name': 'Maina',
            'admission_number': 'STU001',
            'gender': 'male',
            'class_name': 'Grade 8A',
            'grade_level': 'grade-8',
            'section': 'A',
            'date_of_birth': '2010-05-15',
            'profile_image': None
        },
        {
            'id': 2,
            'first_name': 'Grace',
            'last_name': 'Wanjiku',
            'admission_number': 'STU002',
            'gender': 'female',
            'class_name': 'Grade 7B',
            'grade_level': 'grade-7',
            'section': 'B',
            'date_of_birth': '2011-08-20',
            'profile_image': None
        }
    ]


def get_mock_fee_data():
    """Generate mock fee payment data"""
    from datetime import datetime, timedelta
    import random

    fee_data = []
    students = get_mock_students_data()

    for student in students:
        # Generate 3-5 payments per student
        num_payments = random.randint(3, 5)

        for i in range(num_payments):
            payment_date = datetime.now() - timedelta(days=random.randint(1, 90))
            amount_paid = random.randint(2000, 8000)
            amount_due = amount_paid + random.randint(0, 500)

            fee_data.append({
                'id': random.randint(1000, 9999),
                'fee_structure_name': f'Term {random.randint(1, 3)} Fees 2024',
                'amount_paid': amount_paid,
                'amount_due': amount_due,
                'balance': amount_due - amount_paid,
                'payment_date_display': payment_date.strftime('%d %b %Y'),
                'payment_method': random.choice(['mpesa', 'cash', 'bank_transfer']),
                'receipt_number': f'RCP{random.randint(10000, 99999)}',
                'transaction_id': f'TXN{random.randint(100000, 999999)}'
            })

    return fee_data


def get_mock_results_data():
    """Generate mock exam results data"""
    results_data = []
    students = get_mock_students_data()
    subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'CRE']
    exam_types = ['CAT 1', 'CAT 2', 'Mid Term', 'CAT 3', 'End Term']

    for student in students:
        for subject in subjects:
            # Generate results for 3-5 recent exams
            num_exams = random.randint(3, 5)
            recent_exams = exam_types[-num_exams:]

            for exam in recent_exams:
                marks = random.randint(65, 95)
                if marks >= 80:
                    grade = 'A'
                elif marks >= 75:
                    grade = 'A-'
                elif marks >= 70:
                    grade = 'B+'
                elif marks >= 65:
                    grade = 'B'
                else:
                    grade = 'B-'

                results_data.append({
                    'student_name': f"{student['first_name']} {student['last_name']}",
                    'exam_name': exam,
                    'exam_type': exam.lower().replace(' ', '_'),
                    'subject': subject,
                    'marks_obtained': marks,
                    'grade': grade,
                    'points': random.randint(8, 12),
                    'teacher_remarks': random.choice([
                        'Good performance, keep it up!',
                        'Needs to work on calculations',
                        'Excellent understanding of concepts',
                        'Consistent improvement shown',
                        'Good participation in class'
                    ])
                })

    return results_data


def get_mock_attendance_data():
    """Generate mock attendance data"""
    attendance_data = []
    students = get_mock_students_data()

    # Generate attendance for last 30 days
    from datetime import datetime, timedelta

    for i in range(30):
        date = datetime.now() - timedelta(days=i)

        for student in students:
            # 90% chance of being present
            status = 'present' if random.random() < 0.9 else 'absent'
            reason = random.choice([
                'Sick leave', 'Family emergency', 'School activity', ''
            ]) if status == 'absent' else ''

            attendance_data.append({
                'student_name': f"{student['first_name']} {student['last_name']}",
                'date_display': date.strftime('%d %b %Y'),
                'status': status,
                'reason': reason
            })

    return attendance_data


def get_mock_announcements_data():
    """Generate mock announcements data"""
    from datetime import datetime, timedelta
    import random

    announcements = [
        {
            'id': 1,
            'subject': 'School Holiday Notice',
            'message': 'School will close for holidays starting December 20th. All students are expected to report back on January 3rd, 2025. Please ensure all school property is returned before the holidays.',
            'priority': 'high',
            'created_display': (datetime.now() - timedelta(days=2)).strftime('%d %b %Y %H:%M')
        },
        {
            'id': 2,
            'subject': 'Parent-Teacher Meeting',
            'message': 'Parent-teacher meeting is scheduled for November 25th at 2 PM in the school hall. All parents are requested to attend to discuss their child\'s progress.',
            'priority': 'medium',
            'created_display': (datetime.now() - timedelta(days=5)).strftime('%d %b %Y %H:%M')
        },
        {
            'id': 3,
            'subject': 'Fee Payment Reminder',
            'message': 'Term 3 fees are now due. Please ensure timely payment to avoid penalties. Payment can be made via M-Pesa or bank transfer.',
            'priority': 'medium',
            'created_display': (datetime.now() - timedelta(days=7)).strftime('%d %b %Y %H:%M')
        },
        {
            'id': 4,
            'subject': 'Sports Day Announcement',
            'message': 'Annual Sports Day will be held on December 15th. All students must come in their house colors. Parents are welcome to attend.',
            'priority': 'low',
            'created_display': (datetime.now() - timedelta(days=10)).strftime('%d %b %Y %H:%M')
        },
        {
            'id': 5,
            'subject': 'Examination Schedule',
            'message': 'End of term examinations will begin on December 10th. Students should revise thoroughly and arrive at school on time.',
            'priority': 'high',
            'created_display': (datetime.now() - timedelta(days=12)).strftime('%d %b %Y %H:%M')
        }
    ]

    return announcements


class ParentStudentsAPIView(APIView):
    """
    List all students linked to the parent
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        students = parent.linked_students.all()
        serializer = ParentStudentSerializer(students, many=True)
        return Response(serializer.data, status=200)


class ParentFeesAPIView(APIView):
    """
    Show fee payments for all linked students
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        student_ids = parent.linked_students.values_list('id', flat=True)
        fee_payments = FeePayment.objects.filter(
            student_id__in=student_ids,
            payment_status='completed'
        ).select_related('student', 'fee_structure').order_by('-payment_date')

        if not fee_payments:
            # Return mock fee data for demonstration
            return Response(get_mock_fee_data(), status=200)

        serializer = ParentFeeSerializer(fee_payments, many=True)
        return Response(serializer.data, status=200)


class ParentResultsAPIView(APIView):
    """
    Show exam results for all linked students
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        results_data = []

        for student in parent.linked_students.all():
            exam_marks = ExamMark.objects.filter(
                student=student,
                is_absent=False
            ).select_related('exam', 'subject').order_by('-exam__exam_date')

            for mark in exam_marks:
                results_data.append({
                    'student_name': f"{student.first_name} {student.last_name}",
                    'exam_name': mark.exam.name,
                    'exam_type': mark.exam.exam_type,
                    'subject': mark.subject.name,
                    'marks_obtained': mark.marks_obtained,
                    'grade': mark.grade,
                    'points': mark.points,
                    'teacher_remarks': mark.teacher_remarks
                })

        if not results_data:
            # Return mock results data for demonstration
            results_data = get_mock_results_data()

        return Response(results_data, status=200)


class ParentAttendanceAPIView(APIView):
    """
    Show attendance records for all linked students
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        attendance_data = []

        for student in parent.linked_students.all():
            attendances = Attendance.objects.filter(
                student=student
            ).select_related('academic_year').order_by('-date')[:30]  # Last 30 days

            for attendance in attendances:
                attendance_data.append({
                    'student_name': f"{student.first_name} {student.last_name}",
                    'date_display': attendance.date.strftime('%d %b %Y'),
                    'status': attendance.status,
                    'reason': attendance.reason
                })

        if not attendance_data:
            # Return mock attendance data for demonstration
            attendance_data = get_mock_attendance_data()

        return Response(attendance_data, status=200)


class ParentAnnouncementsAPIView(APIView):
    """
    Show school announcements and notices
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            parent = Parent.objects.get(phone_number=request.user.username, is_active=True)
        except Parent.DoesNotExist:
            return Response({"error": "Parent profile not found"}, status=404)

        student_ids = parent.linked_students.values_list('id', flat=True)

        # Get notifications for linked students or general school notifications
        notifications = Notification.objects.filter(
            Q(student_id__in=student_ids) | Q(student__isnull=True)
        ).order_by('-created_at')[:20]

        if not notifications:
            # Return mock announcements data for demonstration
            return Response(get_mock_announcements_data(), status=200)

        serializer = ParentNotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=200)
