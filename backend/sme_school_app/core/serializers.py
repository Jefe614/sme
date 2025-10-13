from rest_framework import serializers

from tenants.models import Company
from .models import Staff, StudentClass, Subject, Transaction, Student, FeePayment


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

class StudentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
    
    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Handle date formatting for frontend
        if instance.date_of_birth:
            data['date_of_birth'] = instance.date_of_birth.isoformat()
        if instance.admission_date:
            data['admission_date'] = instance.admission_date.isoformat()
        if instance.boarding_since:
            data['boarding_since'] = instance.boarding_since.isoformat()
        return data

class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    
    class Meta:
        model = FeePayment
        fields = '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['date_paid'] = instance.date_paid.isoformat()
        return data
    

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