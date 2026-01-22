from rest_framework import serializers
from django.db.models import Sum

from tenants.models import Company
from .models import Attendance, Staff, StudentClass, Subject, Transaction, Student, FeePayment, FeeStructure, FeeDiscount, DocumentTemplate, Notification, AcademicYear, Term, ClassSubjectAssignment, GradingSystem, Exam, ExamMark


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
    

class AcademicCalenderSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = AcademicYear
        fields = [
            "id", "name"
        ]

class TermsSerialzer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = [
            "id", "name"
        ]


class FeeStructureSerializer(serializers.ModelSerializer):
    academic_year = AcademicCalenderSerializer(read_only=True)
    term = TermsSerialzer(read_only=True)
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
    academic_year_read = AcademicCalenderSerializer(source='academic_year', read_only=True)
    class_teacher = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = StudentClass
        fields = [
            'id', 'name', 'grade_level', 'section', 'academic_year_read',
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


# Academic Year Serializer
class AcademicYearSerializer(serializers.ModelSerializer):
    terms_count = serializers.SerializerMethodField()
    is_current_year = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = [
            'id', 'name', 'start_date', 'end_date', 'is_active', 'is_archived',
            'terms_count', 'is_current_year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['terms_count', 'is_current_year']

    def get_terms_count(self, obj):
        return obj.terms.count()

    def get_is_current_year(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date


# Term Serializer
class TermSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    is_within_date_range = serializers.SerializerMethodField()

    class Meta:
        model = Term
        fields = [
            'id', 'academic_year', 'academic_year_name', 'name', 'start_date', 'end_date',
            'is_current', 'is_locked', 'is_within_date_range', 'created_at', 'updated_at'
        ]
        read_only_fields = ['is_within_date_range']

    def get_is_within_date_range(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date


# Subject Serializer
class SubjectSerializer(serializers.ModelSerializer):
    grade_levels = serializers.ListField(required=False, default=list)

    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'category', 'description', 'grade_levels',
            'credit_hours', 'is_compulsory', 'syllabus', 'materials', 'is_active',
            'created_at'
        ]


# Class-Subject Assignment Serializer
class ClassSubjectAssignmentSerializer(serializers.ModelSerializer):
    student_class_name = serializers.CharField(source='student_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = ClassSubjectAssignment
        fields = [
            'id', 'student_class', 'student_class_name', 'subject', 'subject_name',
            'subject_code', 'academic_year', 'academic_year_name', 'teacher',
            'teacher_name', 'is_active', 'created_at', 'updated_at'
        ]


# Exams & Results Serializers

class GradingSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingSystem
        fields = [
            'id', 'name', 'grading_type', 'grading_scale', 'is_default',
            'is_active', 'created_at', 'updated_at'
        ]


class ExamSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    student_class_name = serializers.CharField(source='student_class.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    marks_count = serializers.SerializerMethodField()
    is_published = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'company', 'academic_year', 'academic_year_name', 'term', 'term_name',
            'name', 'exam_type', 'student_class', 'student_class_name',
            'total_marks', 'weight_percentage', 'exam_date', 'results_publish_date',
            'is_locked', 'is_active', 'created_by', 'created_by_name',
            'notes', 'marks_count', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['marks_count', 'is_published']

    def get_marks_count(self, obj):
        return obj.marks.count()

    def get_is_published(self, obj):
        from django.utils import timezone
        if obj.results_publish_date:
            return timezone.now().date() >= obj.results_publish_date
        return False


class ExamMarkSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.full_name', read_only=True)

    class Meta:
        model = ExamMark
        fields = [
            'id', 'company', 'exam', 'exam_name', 'student', 'student_name', 'admission_number',
            'subject', 'subject_name', 'subject_code', 'marks_obtained', 'cbc_level',
            'grade', 'points', 'teacher_remarks', 'is_absent', 'entered_by',
            'entered_by_name', 'entered_at'
        ]
        read_only_fields = ['grade', 'points', 'entered_at']


class BulkExamMarkSerializer(serializers.Serializer):
    """Serializer for bulk marks entry"""
    exam_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    marks_data = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField(allow_blank=True)
        )
    )


class StudentReportCardSerializer(serializers.Serializer):
    """Serializer for student report card data"""
    student_id = serializers.IntegerField()
    term_id = serializers.IntegerField()
    academic_year_id = serializers.IntegerField()

    def to_representation(self, instance):
        # Custom representation for report card data
        student = instance['student']
        exam_marks = instance['exam_marks']
        term = instance['term']

        # Calculate averages and grades
        total_marks = 0
        total_weight = 0
        subject_results = []

        for mark in exam_marks:
            if mark.marks_obtained and not mark.is_absent:
                weight = float(mark.exam.weight_percentage)
                weighted_mark = float(mark.marks_obtained) * (weight / 100)
                total_marks += weighted_mark
                total_weight += weight

                subject_results.append({
                    'subject_name': mark.subject.name,
                    'subject_code': mark.subject.code,
                    'marks_obtained': mark.marks_obtained,
                    'grade': mark.grade,
                    'points': mark.points,
                    'exam_name': mark.exam.name,
                    'weight': mark.exam.weight_percentage
                })

        mean_score = total_marks / total_weight if total_weight > 0 else 0

        # Determine overall grade based on mean score
        overall_grade = self._calculate_overall_grade(mean_score, student.company)

        return {
            'student': {
                'id': student.id,
                'name': student.get_full_name(),
                'admission_number': student.admission_number,
                'class_name': student.student_class.name if student.student_class else None
            },
            'term': {
                'id': term.id,
                'name': term.name,
                'academic_year': term.academic_year.name
            },
            'mean_score': round(mean_score, 2),
            'overall_grade': overall_grade,
            'subject_results': subject_results,
            'generated_at': serializers.DateTimeField().to_representation(serializers.DateTimeField().get_default())
        }

    def _calculate_overall_grade(self, mean_score, company):
        """Calculate overall grade based on school's grading system"""
        try:
            grading_system = GradingSystem.objects.filter(
                company=company,
                is_default=True,
                is_active=True
            ).first()

            if grading_system and grading_system.grading_type == '8-4-4':
                for grade_rule in grading_system.grading_scale:
                    if (grade_rule['min_mark'] <= mean_score <= grade_rule['max_mark']):
                        return grade_rule['grade']
        except:
            pass
        return None


class ClassPerformanceSerializer(serializers.Serializer):
    """Serializer for class performance analytics"""
    class_id = serializers.IntegerField()
    term_id = serializers.IntegerField()
    academic_year_id = serializers.IntegerField()

    def to_representation(self, instance):
        student_class = instance['student_class']
        exam_marks = instance['exam_marks']

        # Calculate class statistics
        student_stats = {}
        subject_stats = {}

        for mark in exam_marks:
            student_id = mark.student.id
            subject_id = mark.subject.id

            if student_id not in student_stats:
                student_stats[student_id] = {
                    'student_name': mark.student.get_full_name(),
                    'admission_number': mark.student.admission_number,
                    'total_marks': 0,
                    'total_weight': 0,
                    'subject_count': 0
                }

            if subject_id not in subject_stats:
                subject_stats[subject_id] = {
                    'subject_name': mark.subject.name,
                    'marks': [],
                    'pass_count': 0,
                    'total_students': 0
                }

            if mark.marks_obtained and not mark.is_absent:
                weight = float(mark.exam.weight_percentage)
                weighted_mark = float(mark.marks_obtained) * (weight / 100)

                student_stats[student_id]['total_marks'] += weighted_mark
                student_stats[student_id]['total_weight'] += weight
                student_stats[student_id]['subject_count'] += 1

                subject_stats[subject_id]['marks'].append(mark.marks_obtained)
                subject_stats[subject_id]['total_students'] += 1
                if mark.marks_obtained >= 50:  # Assuming 50 is pass mark
                    subject_stats[subject_id]['pass_count'] += 1

        # Calculate averages
        for student_stat in student_stats.values():
            if student_stat['total_weight'] > 0:
                student_stat['mean_score'] = student_stat['total_marks'] / student_stat['total_weight']
            else:
                student_stat['mean_score'] = 0

        for subject_stat in subject_stats.values():
            if subject_stat['marks']:
                subject_stat['average_mark'] = sum(subject_stat['marks']) / len(subject_stat['marks'])
                subject_stat['pass_rate'] = (subject_stat['pass_count'] / subject_stat['total_students']) * 100
            else:
                subject_stat['average_mark'] = 0
                subject_stat['pass_rate'] = 0

        # Sort students by mean score for ranking
        student_rankings = sorted(
            student_stats.values(),
            key=lambda x: x['mean_score'],
            reverse=True
        )

        return {
            'class_name': student_class.name,
            'total_students': len(student_rankings),
            'subject_performance': list(subject_stats.values()),
            'student_rankings': student_rankings,
            'class_average': sum(s['mean_score'] for s in student_rankings) / len(student_rankings) if student_rankings else 0
        }


# Attendance Serializers
class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model - returns JSON response for API"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.CharField(source='student_class.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'student_class',
            'class_name', 'academic_year', 'academic_year_name', 'term', 'term_name',
            'date', 'status', 'reason', 'remarks', 'marked_by', 'marked_by_name', 'marked_at'
        ]
        read_only_fields = ['marked_at']


class AttendanceSummarySerializer(serializers.Serializer):
    """Serializer for attendance summary data"""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    admission_number = serializers.CharField()
    class_name = serializers.CharField()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    excused_days = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
