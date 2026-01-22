from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Parent
from core.models import Student, FeePayment, Attendance, Exam, ExamMark, Notification
from core.serializers import StudentSerializer, FeePaymentSerializer, AttendanceSerializer


class ParentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    linked_students_count = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone_number', 'email', 'linked_students_count', 'is_active', 'created_at']
        read_only_fields = ['created_at', 'full_name', 'linked_students_count']

    def get_linked_students_count(self, obj):
        return obj.linked_students.count()


class ParentDashboardSerializer(serializers.Serializer):
    """Serializer for parent dashboard data"""
    student_name = serializers.CharField()
    class_name = serializers.CharField()
    admission_number = serializers.CharField()
    fee_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    latest_exam_result = serializers.DictField()
    latest_announcement = serializers.DictField(allow_null=True)


class ParentStudentSerializer(serializers.ModelSerializer):
    """Serializer for student data visible to parents"""
    class_name = serializers.CharField(source='student_class.name', read_only=True)
    grade_level = serializers.CharField(source='student_class.grade_level', read_only=True)
    section = serializers.CharField(source='student_class.section', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'admission_number', 'gender',
            'class_name', 'grade_level', 'section', 'date_of_birth', 'profile_image'
        ]


class ParentFeeSerializer(serializers.ModelSerializer):
    """Serializer for fee data visible to parents"""
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True)
    amount_due = serializers.DecimalField(source='due_amount', max_digits=12, decimal_places=2)
    payment_date_display = serializers.DateField(source='payment_date', format='%d %b %Y')

    class Meta:
        model = FeePayment
        fields = [
            'id', 'fee_structure_name', 'amount_paid', 'amount_due', 'balance',
            'payment_date_display', 'payment_method', 'receipt_number', 'transaction_id'
        ]


class ParentExamResultSerializer(serializers.Serializer):
    """Serializer for exam results visible to parents"""
    exam_name = serializers.CharField()
    exam_type = serializers.CharField()
    subject = serializers.CharField()
    marks_obtained = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    grade = serializers.CharField(allow_null=True)
    points = serializers.IntegerField(allow_null=True)
    teacher_remarks = serializers.CharField(allow_null=True)


class ParentAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance data visible to parents"""
    date_display = serializers.DateField(source='date', format='%d %b %Y')

    class Meta:
        model = Attendance
        fields = ['id', 'date_display', 'status', 'reason']


class ParentNotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications visible to parents"""
    created_display = serializers.DateTimeField(source='created_at', format='%d %b %Y %H:%M')

    class Meta:
        model = Notification
        fields = ['id', 'subject', 'message', 'priority', 'created_display']
