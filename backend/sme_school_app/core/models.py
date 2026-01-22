from django.utils import timezone
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q


# SME Models
class Transaction(models.Model):
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SME'})
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_income = models.BooleanField(default=True)
    date = models.DateField()


    def __str__(self):
        return f"{self.description} - {self.amount}"


# Academic Year Model - Foundation for all academic activities
class AcademicYear(models.Model):
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    name = models.CharField(max_length=20, unique=True, help_text="e.g., 2024-2025")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False, help_text="Only one academic year can be active at a time")
    is_archived = models.BooleanField(default=False, help_text="Archived years cannot be modified")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        ordering = ['-start_date']
        db_table = 'academic_years'
        unique_together = ['company', 'name']

    def clean(self):
        if self.is_active:
            # Ensure only one active academic year per company
            active_years = AcademicYear.objects.filter(
                company=self.company,
                is_active=True
            ).exclude(pk=self.pk)
            if active_years.exists():
                raise ValidationError("Only one academic year can be active at a time.")

        # Validate date range
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date.")

    def delete(self, *args, **kwargs):
        if self.is_active:
            raise ValidationError("Cannot delete an active academic year. Archive it first.")
        super().delete(*args, **kwargs)

    def __str__(self):
        status = " (Active)" if self.is_active else " (Archived)" if self.is_archived else ""
        return f"{self.name}{status}"


# Term Model - Belongs to an academic year
class Term(models.Model):
    TERM_NAMES = (
        ('Term 1', 'Term 1'),
        ('Term 2', 'Term 2'),
        ('Term 3', 'Term 3'),
    )

    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=20, choices=TERM_NAMES)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False, help_text="Only one term can be current per academic year")
    is_locked = models.BooleanField(default=False, help_text="Past terms are locked and cannot be modified")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Term'
        verbose_name_plural = 'Terms'
        ordering = ['start_date']
        db_table = 'terms'
        unique_together = ['academic_year', 'name']

    def clean(self):
        if self.is_current:
            # Ensure only one current term per academic year
            current_terms = Term.objects.filter(
                academic_year=self.academic_year,
                is_current=True
            ).exclude(pk=self.pk)
            if current_terms.exists():
                raise ValidationError("Only one term can be current at a time per academic year.")

        # Validate term dates are within academic year
        if self.start_date < self.academic_year.start_date or self.end_date > self.academic_year.end_date:
            raise ValidationError("Term dates must be within the academic year dates.")

        # Validate term date range
        if self.start_date >= self.end_date:
            raise ValidationError("Term end date must be after start date.")

    def save(self, *args, **kwargs):
        # Auto-lock past terms
        if self.end_date < timezone.now().date() and not self.is_locked:
            self.is_locked = True
        super().save(*args, **kwargs)

    def __str__(self):
        status = " (Current)" if self.is_current else " (Locked)" if self.is_locked else ""
        return f"{self.academic_year.name} - {self.name}{status}"


# School Models
class Student(models.Model):
    STUDENT_TYPES = (
        ('day', 'Day Scholar'),
        ('boarding', 'Boarding Student'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
    )
    
    RELATIONSHIP_CHOICES = (
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    admission_number = models.CharField(max_length=50, unique=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    date_of_birth = models.DateField()
    student_type = models.CharField(max_length=10, choices=STUDENT_TYPES, default='day')
    
    student_class = models.ForeignKey(
        'StudentClass', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='students'
    )
    admission_date = models.DateField(auto_now_add=True)
    
    parent_name = models.CharField(max_length=100 , blank=True, default='')
    relationship = models.CharField(max_length=10, choices=RELATIONSHIP_CHOICES, blank=True, default='')
    parent_phone = models.CharField(max_length=20, blank=True, default='')
    parent_password = models.CharField(max_length=128, blank=True, default='', help_text="Hashed password for parent mobile login")
    
    profile_image = models.ImageField(upload_to='student_profiles/', blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, default='')
    roll_number = models.CharField(max_length=20, blank=True, default='')
    parent_email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    
    hostel = models.CharField(max_length=100, blank=True, default='')
    
    blood_group = models.CharField(max_length=3, blank=True, default='')
    allergies = models.TextField(blank=True, default='')
    medical_conditions = models.TextField(blank=True, default='')
    
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['company', 'admission_number']
    
    def save(self, *args, **kwargs):
        if not self.admission_number:
            last_student = Student.objects.filter(company=self.company).order_by('-id').first()
            if last_student and last_student.admission_number:
                try:
                    last_number = int(last_student.admission_number[3:])
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1
            self.admission_number = f"STU{new_number:06d}"
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"


class StudentClass(models.Model):
    GRADE_LEVELS = (
        ('pre-school', 'Pre-School'),
        ('grade-1', 'Grade 1'),
        ('grade-2', 'Grade 2'),
        ('grade-3', 'Grade 3'),
        ('grade-4', 'Grade 4'),
        ('grade-5', 'Grade 5'),
        ('grade-6', 'Grade 6'),
        ('grade-7', 'Grade 7'),
        ('grade-8', 'Grade 8'),
        ('form-1', 'Form 1'),
        ('form-2', 'Form 2'),
        ('form-3', 'Form 3'),
        ('form-4', 'Form 4'),
    )
    
    SECTION_CHOICES = (
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('E', 'E'),
        ('F', 'F'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    
    name = models.CharField(max_length=100, null=True, blank=True)
    grade_level = models.CharField(max_length=20, choices=GRADE_LEVELS)
    section = models.CharField(max_length=5, choices=SECTION_CHOICES, default='A')

    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_teacher = models.ForeignKey(
        'Staff', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='class_teacher'
    )
    max_students = models.PositiveIntegerField(default=40)
    current_strength = models.PositiveIntegerField(default=0, editable=False)
    
    # Class Details
    room_number = models.CharField(max_length=20, blank=True, null=True)
    class_monitor = models.ForeignKey(
        'Student', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='monitor_of_class'
    )
    curriculum = models.CharField(max_length=100, blank=True, null=True)  # e.g., "CBC", "8-4-4", "IGCSE"
    fee_structure = models.ForeignKey('FeeStructure', on_delete=models.SET_NULL, blank=True, null=True, default=None)
    # Timetable Information
    class_schedule = models.JSONField(default=list) 
    is_active = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['grade_level', 'section']
        db_table = 'classrooms'



class FeeStructure(models.Model):
    FEE_TYPES = (
        ('tuition', 'Tuition Fee'),
        ('boarding', 'Boarding Fee'),
        ('transport', 'Transport Fee'),
        ('library', 'Library Fee'),
        ('sports', 'Sports Fee'),
        ('medical', 'Medical Fee'),
        ('examination', 'Examination Fee'),
        ('development', 'Development Fee'),
        ('other', 'Other Fee'),
    )
    
    TERM_CHOICES = (
        ('term1', 'Term 1'),
        ('term2', 'Term 2'),
        ('term3', 'Term 3'),
        ('annual', 'Annual'),
    )
    
    CURRENCY_CHOICES = (
        ('KES', 'Kenyan Shilling'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    
    # Basic Information
    name = models.CharField(max_length=200, help_text="e.g., Grade 1 Term 1 Fees 2024")
    description = models.TextField(blank=True, null=True)
    
    # Fee Configuration
    fee_type = models.CharField(max_length=20, choices=FEE_TYPES, default='tuition')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='KES')
    
    # Applicability
    grade_level = models.CharField(max_length=20, choices=StudentClass.GRADE_LEVELS, blank=True, null=True)
    student_type = models.CharField(max_length=10, choices=Student.STUDENT_TYPES, blank=True, null=True)
    
    # Academic Context
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE, blank=True, null=True)  # Null for annual fees
    
    # Payment Details
    due_date = models.DateField(blank=True, null=True)
    is_optional = models.BooleanField(default=False)
    late_fee_penalty = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    installment_allowed = models.BooleanField(default=False)
    max_installments = models.PositiveIntegerField(default=1)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fee Structure'
        verbose_name_plural = 'Fee Structures'
        db_table = 'fee_structures'
    
    def __str__(self):
        return f"{self.name} - {self.amount} {self.currency}"
    

# Improved FeePayment model with better relationships
class FeePayment(models.Model):
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('mpesa', 'M-Pesa'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('card', 'Credit/Debit Card'),
    )
    
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="fee_payments")
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name="payments", blank=True, null=True, default=None)
    
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Original amount due", default=0.00)
    balance = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0.00)
    
    # Payment Information
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='completed')
    receipt_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True, help_text="Bank/M-Pesa transaction ID")
    is_installment = models.BooleanField(default=False)    
    notes = models.TextField(blank=True, null=True)
    paid_by = models.CharField(max_length=100, blank=True, null=True, help_text="Name of person who made payment")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fee Payment'
        verbose_name_plural = 'Fee Payments'
        db_table = 'fee_payments'

    
    def save(self, *args, **kwargs):
        # Auto-generate receipt number if not provided
        if not self.receipt_number:
            prefix = f"RCP{self.student.company.id:03d}"
            last_payment = FeePayment.objects.filter(
                student__company=self.student.company
            ).order_by('-id').first()
            
            if last_payment and last_payment.receipt_number:
                try:
                    last_number = int(last_payment.receipt_number.replace(prefix, ''))
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1
            
            self.receipt_number = f"{prefix}{new_number:06d}"
        
        # Calculate balance
        self.balance = self.due_amount - self.amount_paid
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student} - {self.amount_paid} - {self.payment_date}"
    
    @property
    def is_fully_paid(self):
        return self.balance <= 0
    
    @property
    def is_overdue(self):
        if self.fee_structure.due_date:
            return self.payment_date > self.fee_structure.due_date
        return False



# Additional model for fee discounts/scholarships/bursaries
class FeeDiscount(models.Model):
    DISCOUNT_TYPES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
        ('full', 'Full Waiver'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="fee_discounts")
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name="discounts", blank=True, null=True)
    
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES, blank=True, null=True)
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reason = models.TextField(blank=True, null=True)
    approved_by = models.CharField(max_length=100, blank=True, null=True, help_text="Name of person who approved the discount")
    
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Fee Discount'
        verbose_name_plural = 'Fee Discounts'
        db_table = 'fee_discounts'

    def __str__(self):
        return f"{self.student} - {self.discount_type} - {self.discount_value}"
    



class Staff(models.Model):
    STAFF_TYPES = (
        ('teaching', 'Teaching Staff'),
        ('non_teaching', 'Non-Teaching Staff'),
        ('administrative', 'Administrative Staff'),
        ('support', 'Support Staff'),
    )
    
    STAFF_ROLES = (
        ('teacher', 'Teacher'),
        ('head_teacher', 'Head Teacher'),
        ('deputy_head', 'Deputy Head Teacher'),
        ('department_head', 'Department Head'),
        ('secretary', 'Secretary'),
        ('accountant', 'Accountant'),
        ('librarian', 'Librarian'),
        ('nurse', 'Nurse'),
        ('counselor', 'Counselor'),
        ('security', 'Security'),
        ('cleaner', 'Cleaner'),
        ('driver', 'Driver'),
        ('cook', 'Cook'),
    )
    
    DEPARTMENT_CHOICES = (
        ('academic', 'Academic'),
        ('administration', 'Administration'),
        ('finance', 'Finance'),
        ('it', 'IT Department'),
        ('library', 'Library'),
        ('sports', 'Sports'),
        ('science', 'Science'),
        ('humanities', 'Humanities'),
        ('languages', 'Languages'),
        ('mathematics', 'Mathematics'),
        ('guidance', 'Guidance and Counseling'),
        ('medical', 'Medical'),
        ('maintenance', 'Maintenance'),
    )
    
    QUALIFICATION_CHOICES = (
        ('certificate', 'Certificate'),
        ('diploma', 'Diploma'),
        ('degree', 'Bachelor\'s Degree'),
        ('masters', 'Master\'s Degree'),
        ('phd', 'PhD'),
        ('other', 'Other'),
    )
    
    EMPLOYMENT_TYPE_CHOICES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('probation', 'Probation'),
        ('intern', 'Intern'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    
    BLOOD_GROUP_CHOICES = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'}, blank=True, null=True)
    
    # Basic Information
    staff_id = models.CharField(max_length=50, unique=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    profile_image = models.ImageField(upload_to='staff_profiles/', blank=True, null=True)
    
    # Contact Information
    personal_phone = models.CharField(max_length=20, blank=True, null=True)
    alternative_phone = models.CharField(max_length=20, blank=True, null=True)
    personal_email = models.EmailField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)
    
    # Address Information
    residential_address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Employment Details
    staff_type = models.CharField(max_length=20, choices=STAFF_TYPES, default='teaching')
    staff_role = models.CharField(max_length=20, choices=STAFF_ROLES, default='teacher')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    employment_type = models.CharField(max_length=15, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    employee_number = models.CharField(max_length=50, unique=True, blank=True)
    
    # Academic & Professional Information
    qualification = models.CharField(max_length=20, choices=QUALIFICATION_CHOICES, blank=True, null=True)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    tsc_number = models.CharField(max_length=50, blank=True, null=True, help_text="Teachers Service Commission Number")
    kuppet_number = models.CharField(max_length=50, blank=True, null=True, help_text="KUPPET Membership Number")
    knut_number = models.CharField(max_length=50, blank=True, null=True, help_text="KNUT Membership Number")
    
    date_joined = models.DateField(auto_now_add=True)
    contract_start_date = models.DateField(blank=True, null=True)
    contract_end_date = models.DateField(blank=True, null=True)
    probation_end_date = models.DateField(blank=True, null=True)
    
    subjects = models.ManyToManyField('Subject', blank=True, related_name='teachers')
    classes_taught = models.ManyToManyField('StudentClass', blank=True, related_name='teachers')
    is_class_teacher = models.BooleanField(default=False)
    class_teacher_of = models.OneToOneField(
        'StudentClass', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='class_teacher_info'
    )
    
    # Salary Information
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_branch = models.CharField(max_length=100, blank=True, null=True)
    
    # Medical Information
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    doctor_info = models.TextField(blank=True, null=True)
    
    # Additional Information
    bio = models.TextField(blank=True, null=True, help_text="Brief biography or profile")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments")
    is_active = models.BooleanField(default=True)
    is_teaching_staff = models.BooleanField(default=False, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff Members'
        db_table = 'staff'

    
    def save(self, *args, **kwargs):
        # Auto-generate staff ID if not provided
        if not self.staff_id:
            prefix = f"STAFF{self.company.id:03d}"
            last_staff = Staff.objects.filter(company=self.company).order_by('-id').first()
            if last_staff and last_staff.staff_id:
                try:
                    last_number = int(last_staff.staff_id.replace(prefix, ''))
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1
            self.staff_id = f"{prefix}{new_number:03d}"
        
        # Auto-generate employee number if not provided
        if not self.employee_number:
            year = timezone.now().year
            last_employee = Staff.objects.filter(company=self.company).order_by('-id').first()
            if last_employee and last_employee.employee_number:
                try:
                    last_number = int(last_employee.employee_number[3:])
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1
            self.employee_number = f"EMP{new_number:03d}"
        
        # Automatically set is_teaching_staff based on staff_type
        self.is_teaching_staff = self.staff_type == 'teaching'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.staff_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    

class Subject(models.Model):
    SUBJECT_CATEGORIES = (
        ('core', 'Core Subject'),
        ('elective', 'Elective Subject'),
        ('extracurricular', 'Extracurricular'),
        ('language', 'Language'),
    )
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=20, choices=SUBJECT_CATEGORIES, default='core')
    description = models.TextField(blank=True, null=True)
    
    # Subject Details
    grade_levels = models.JSONField(default=list, help_text="List of grade levels this subject is taught in")
    credit_hours = models.PositiveIntegerField(default=1)
    is_compulsory = models.BooleanField(default=False)
    # Resources
    syllabus = models.FileField(upload_to='subject_syllabus/', blank=True, null=True)
    materials = models.TextField(blank=True, null=True, help_text="Required materials or textbooks")    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        db_table = 'subjects'
   
    
    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name


# Class-Subject Assignment Model - Links subjects to classes per academic year
class ClassSubjectAssignment(models.Model):
    student_class = models.ForeignKey(StudentClass, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='class_assignments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='class_subject_assignments')

    # Optional teacher assignment for this subject in this class
    teacher = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='subject_assignments',
        help_text="Teacher assigned to teach this subject in this class"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Class Subject Assignment'
        verbose_name_plural = 'Class Subject Assignments'
        db_table = 'class_subject_assignments'
        unique_together = ['student_class', 'subject', 'academic_year']

    def clean(self):
        # Ensure the subject and class belong to the same company
        if self.student_class.company != self.subject.company:
            raise ValidationError("Subject and class must belong to the same school.")

        # Ensure the academic year belongs to the same company
        if self.academic_year.company != self.student_class.company:
            raise ValidationError("Academic year must belong to the same school.")

        # Validate teacher belongs to the same company
        if self.teacher and self.teacher.company != self.student_class.company:
            raise ValidationError("Teacher must belong to the same school.")

    def __str__(self):
        return f"{self.student_class} - {self.subject} ({self.academic_year.name})"


# Staff Attendance Model
class StaffAttendance(models.Model):
    ATTENDANCE_STATUS = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
        ('sick', 'Sick Leave'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS, default='present')
    leave_type = models.CharField(max_length=50, blank=True, null=True)
    leave_reason = models.TextField(blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    recorded_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, blank=True, null=True, related_name='recorded_attendances')

    class Meta:
        verbose_name = 'Staff Attendance'
        verbose_name_plural = 'Staff Attendance Records'
        db_table = 'staff_attendance'

    def __str__(self):
        return f"{self.staff} - {self.date} - {self.status}"


# Student Attendance Model
class Attendance(models.Model):
    ATTENDANCE_STATUS = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    student_class = models.ForeignKey(StudentClass, on_delete=models.CASCADE, related_name='attendance_records')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='attendance_records')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='attendance_records')

    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS, default='present')

    # Optional reason and remarks
    reason = models.TextField(blank=True, null=True, help_text="Reason for absence/late/excused")
    remarks = models.TextField(blank=True, null=True, help_text="Additional remarks")

    # Audit trail
    marked_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='marked_attendances',
        help_text="Staff member who marked this attendance"
    )
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Student Attendance'
        verbose_name_plural = 'Student Attendance Records'
        db_table = 'student_attendance'
        unique_together = ['company', 'student', 'date']
        ordering = ['-date', 'student__first_name', 'student__last_name']

    def clean(self):
        # Ensure student belongs to the specified class
        if self.student.student_class != self.student_class:
            raise ValidationError("Student does not belong to the specified class.")

        # Ensure academic year and term are consistent
        if self.term.academic_year != self.academic_year:
            raise ValidationError("Term must belong to the selected academic year.")

        # Ensure date is within academic year range
        if not (self.academic_year.start_date <= self.date <= self.academic_year.end_date):
            raise ValidationError("Attendance date must be within the academic year.")

        # Ensure date is within term range
        if not (self.term.start_date <= self.date <= self.term.end_date):
            raise ValidationError("Attendance date must be within the term.")

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date} - {self.status}"


# Document Template Model for customizable school documents
class DocumentTemplate(models.Model):
    TEMPLATE_CATEGORIES = (
        ('admission', 'Admission Letter'),
        ('transfer', 'Transfer Letter'),
        ('warning', 'Warning Letter'),
        ('suspension', 'Suspension Letter'),
        ('fee_reminder', 'Fee Reminder'),
        ('clearance', 'Clearance Form'),
        ('invitation', 'Meeting Invitation'),
        ('notice', 'School Notice'),
        ('recommendation', 'Student Recommendation'),
        ('employment', 'Employment Contract'),
        ('custom', 'Custom Template'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    name = models.CharField(max_length=200, help_text="Template name, e.g., 'Admission Letter 2024'")
    category = models.CharField(max_length=20, choices=TEMPLATE_CATEGORIES, default='custom')

    # Template Content
    template_body = models.TextField(help_text="Template with {{placeholders}} for dynamic content")
    description = models.TextField(blank=True, null=True, help_text="Description of template purpose and variables used")

    # Metadata
    is_default = models.BooleanField(default=False, help_text="Whether this is a system default template")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Variables used in template (stored as JSON for easy access)
    variables_used = models.JSONField(default=list, help_text="List of variable names used in the template")

    class Meta:
        verbose_name = 'Document Template'
        verbose_name_plural = 'Document Templates'
        db_table = 'document_templates'
        unique_together = ['company', 'name']

    def __str__(self):
        return f"{self.name} ({self.category}) - {self.company.name}"

    def get_variables(self):
        """Extract variables from template_body"""
        import re
        return re.findall(r'\{\{(\w+)\}\}', self.template_body)

    def save(self, *args, **kwargs):
        if not self.variables_used:
            self.variables_used = self.get_variables()
        super().save(*args, **kwargs)


# Notification Model
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('push', 'Push Notification'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})

    # Basic Information
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='sms')
    subject = models.CharField(max_length=255, help_text="Subject for email or summary for SMS")
    message = models.TextField()

    # Recipients - Use student parent information
    recipient_email = models.EmailField(blank=True, null=True)
    recipient_phone = models.CharField(max_length=20, blank=True, null=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, blank=True, null=True, help_text="Student for parent notifications")

    # Status and Priority
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    # Timestamps
    scheduled_at = models.DateTimeField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    # Metadata
    sent_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        db_table = 'notifications'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.notification_type.upper()} to {self.parent or self.recipient_phone or self.recipient_email} - {self.status}"


# Exams & Results Models

class GradingSystem(models.Model):
    GRADING_TYPES = (
        ('8-4-4', '8-4-4 System'),
        ('cbc', 'Competency Based Curriculum (CBC)'),
        ('custom', 'Custom Grading'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    name = models.CharField(max_length=100, help_text="e.g., KCSE Grading, CBC Primary")
    grading_type = models.CharField(max_length=10, choices=GRADING_TYPES, default='8-4-4')

    # Grading scales stored as JSON
    grading_scale = models.JSONField(default=list, help_text="""
    For 8-4-4: [{"min_mark": 80, "max_mark": 100, "grade": "A", "points": 12}, ...]
    For CBC: [{"level": "Exceeding Expectations", "description": "..."}, ...]
    """)

    is_default = models.BooleanField(default=False, help_text="Default grading system for this school")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Grading System'
        verbose_name_plural = 'Grading Systems'
        db_table = 'grading_systems'
        unique_together = ['company', 'name']

    def clean(self):
        if self.is_default:
            # Ensure only one default grading system per company
            default_systems = GradingSystem.objects.filter(
                company=self.company,
                is_default=True
            ).exclude(pk=self.pk)
            if default_systems.exists():
                raise ValidationError("Only one grading system can be default per school.")

    def __str__(self):
        return f"{self.name} ({self.grading_type}) - {self.company.name}"


class Exam(models.Model):
    EXAM_TYPES = (
        ('cat1', 'CAT 1'),
        ('cat2', 'CAT 2'),
        ('mid_term', 'Mid Term'),
        ('end_term', 'End Term'),
        ('custom', 'Custom Exam'),
    )

    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='exams')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='exams')

    name = models.CharField(max_length=100, help_text="e.g., End Term Exam, CAT 1")
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES, default='end_term')

    # Class assignment - can be specific class or whole school
    student_class = models.ForeignKey(
        StudentClass,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='exams',
        help_text="Specific class for this exam, leave empty for whole school"
    )

    # Exam configuration
    total_marks = models.PositiveIntegerField(default=100)
    weight_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        help_text="Weight of this exam in overall term grade (e.g., 30 for CAT, 70 for End Term)"
    )

    # Dates
    exam_date = models.DateField(blank=True, null=True)
    results_publish_date = models.DateField(blank=True, null=True)

    # Status
    is_locked = models.BooleanField(default=False, help_text="Lock exam after results are published")
    is_active = models.BooleanField(default=True)

    # Metadata
    created_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'
        db_table = 'exams'
        ordering = ['-exam_date', 'name']

    def clean(self):
        # Validate weight percentage
        if self.weight_percentage < 0 or self.weight_percentage > 100:
            raise ValidationError("Weight percentage must be between 0 and 100.")

        # Ensure exam belongs to same company as academic year and term
        if self.academic_year.company != self.company:
            raise ValidationError("Academic year must belong to the same school.")
        if self.term.academic_year != self.academic_year:
            raise ValidationError("Term must belong to the selected academic year.")

        # Validate class belongs to same company
        if self.student_class and self.student_class.company != self.company:
            raise ValidationError("Class must belong to the same school.")

    def __str__(self):
        class_info = f" - {self.student_class}" if self.student_class else " - Whole School"
        return f"{self.name} ({self.term.name}, {self.academic_year.name}){class_info}"


class ExamMark(models.Model):
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_marks')

    # Marks/Grades - flexible for different systems
    marks_obtained = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Numerical marks obtained (for 8-4-4 system)"
    )

    # For CBC system
    cbc_level = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="CBC level: Exceeding Expectations, Meeting Expectations, etc."
    )

    # Auto-calculated fields
    grade = models.CharField(max_length=10, blank=True, null=True, help_text="Calculated grade (A, B+, etc.)")
    points = models.PositiveIntegerField(blank=True, null=True, help_text="Grade points for ranking")

    # Comments and validation
    teacher_remarks = models.TextField(blank=True, null=True)
    is_absent = models.BooleanField(default=False, help_text="Student was absent for this exam")

    # Metadata
    entered_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, blank=True, null=True)
    entered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Exam Mark'
        verbose_name_plural = 'Exam Marks'
        db_table = 'exam_marks'
        unique_together = ['exam', 'student', 'subject']

    def clean(self):
        # Ensure all entities belong to same company
        if self.exam.company != self.company:
            raise ValidationError("Exam must belong to the same school.")
        if self.student.company != self.company:
            raise ValidationError("Student must belong to the same school.")
        if self.subject.company != self.company:
            raise ValidationError("Subject must belong to the same school.")

        # Validate marks don't exceed total marks
        if self.marks_obtained and self.marks_obtained > self.exam.total_marks:
            raise ValidationError(f"Marks obtained cannot exceed total marks ({self.exam.total_marks}).")

        # Ensure student is in the exam's class (if exam is class-specific)
        if self.exam.student_class and self.student.student_class != self.exam.student_class:
            raise ValidationError("Student must be in the exam's assigned class.")

        # Validate subject is assigned to student's class
        if not ClassSubjectAssignment.objects.filter(
            student_class=self.student.student_class,
            subject=self.subject,
            academic_year=self.exam.academic_year
        ).exists():
            raise ValidationError("Subject is not assigned to student's class for this academic year.")

    def save(self, *args, **kwargs):
        # Auto-calculate grade and points based on grading system
        if self.marks_obtained and not self.is_absent:
            self._calculate_grade_and_points()
        super().save(*args, **kwargs)

    def _calculate_grade_and_points(self):
        """Calculate grade and points based on school's grading system"""
        try:
            # Get default grading system for the school
            grading_system = GradingSystem.objects.filter(
                company=self.exam.company,
                is_default=True,
                is_active=True
            ).first()

            if grading_system and grading_system.grading_type == '8-4-4':
                for grade_rule in grading_system.grading_scale:
                    if (grade_rule['min_mark'] <= float(self.marks_obtained) <= grade_rule['max_mark']):
                        self.grade = grade_rule['grade']
                        self.points = grade_rule['points']
                        break

        except Exception as e:
            # Log error but don't fail save
            import logging
            logging.error(f"Error calculating grade for exam mark {self.pk}: {str(e)}")

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.exam} ({self.marks_obtained or self.cbc_level})"
