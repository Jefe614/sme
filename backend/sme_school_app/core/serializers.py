from rest_framework import serializers
from django.db.models import Sum

from tenants.models import Company
from .models import Staff, StudentClass, Subject, Transaction, Student, FeePayment, FeeStructure, FeeDiscount, DocumentTemplate, Notification


class CompanySerializer(serializers.ModelSerializer):
    domain = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "company_type",
            "paid_until",
            "on_trial",
            "domain",
        ]

    def get_domain(self, obj):
        domain = obj.domains.filter(is_primary=True).first()
        return domain.domain if domain else None


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'


class StudentClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentClass
        fields = [
            'id', 'name'
        ]

class StudentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    age = serializers.SerializerMethodField()
    student_class = StudentClassSerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'
    
    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None
    

class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = FeePayment
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['date_paid'] = instance.payment_date.isoformat()
        return data


class FeeStructureSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.payments.filter(payment_status='completed').distinct('student').count()

    def get_total_paid(self, obj):
        return obj.payments.filter(payment_status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or 0


class FeeDiscountSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True)

    class Meta:
        model = FeeDiscount
        fields = '__all__'
    

class StudentClassSerializer(serializers.ModelSerializer):
    class_teacher = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = StudentClass
        fields = [
            'id', 'name', 'grade_level', 'section', 'academic_year',
            'class_teacher', 'max_students', 'current_strength',
            'room_number', 'curriculum', 'class_schedule', 'is_active',
            'created_at', 'updated_at'
        ]



class StaffSerializer(serializers.ModelSerializer):
    subjects = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), many=True, required=False)
    classes_taught = serializers.PrimaryKeyRelatedField(queryset=StudentClass.objects.all(), many=True, required=False)
    class_teacher_of = serializers.PrimaryKeyRelatedField(queryset=StudentClass.objects.all(), allow_null=True, required=False)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Staff
        fields = [
            'id',
            'staff_id', 'first_name', 'last_name', 'full_name', 'gender', 'date_of_birth', 'nationality',
            'profile_image', 'personal_phone', 'alternative_phone', 'personal_email',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'residential_address', 'city', 'postal_code', 'staff_type', 'staff_role', 'department',
            'employment_type', 'employee_number', 'qualification', 'specialization', 'tsc_number',
            'kuppet_number', 'knut_number', 'date_joined', 'contract_start_date', 'contract_end_date',
            'probation_end_date', 'subjects', 'classes_taught', 'is_class_teacher', 'class_teacher_of',
            'basic_salary', 'bank_name', 'bank_account_number', 'bank_branch', 'blood_group',
            'allergies', 'medical_conditions', 'doctor_info', 'bio', 'notes', 'is_active',
            'is_teaching_staff', 'created_at'
        ]


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'template_body', 'description',
            'is_default', 'is_active', 'variables_used', 'created_at', 'updated_at'
        ]





class NotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    parent_name = serializers.CharField(source='student.parent_name', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'subject', 'message', 'recipient_email',
            'recipient_phone', 'student', 'student_name', 'admission_number', 'parent_name',
            'priority', 'status', 'scheduled_at', 'sent_at', 'sent_by', 'sent_by_name',
            'error_message', 'reference_number', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'sent_at', 'error_message', 'reference_number', 'created_at', 'updated_at']
