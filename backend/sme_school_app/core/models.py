from django.utils import timezone 
from django.db import models
from django.core.exceptions import ValidationError


# SME Models
class Transaction(models.Model):
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SME'})
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_income = models.BooleanField(default=True)
    date = models.DateField()


    def __str__(self):
        return f"{self.description} - {self.amount}"



# School Models
class Student(models.Model):
    STUDENT_TYPES = (
        ('day', 'Day Scholar'),
        ('boarding', 'Boarding Student'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    
    RELATIONSHIP_CHOICES = (
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
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
    
    company = models.ForeignKey("tenants.Company", on_delete=models.CASCADE, limit_choices_to={'company_type': 'SCHOOL'})
    
    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    admission_number = models.CharField(max_length=50, unique=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    date_of_birth = models.DateField(blank=True, null=True, default=None)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    profile_image = models.ImageField(upload_to='student_profiles/', blank=True, null=True)
    
    # Student Type
    student_type = models.CharField(max_length=10, choices=STUDENT_TYPES, default='day')
    
    # Academic Details
    student_class = models.ForeignKey(
        'StudentClass', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='students'
    )    
    section = models.CharField(max_length=10, blank=True, null=True)
    admission_date = models.DateField()
    roll_number = models.CharField(max_length=20, blank=True, null=True)
    class_teacher = models.CharField(max_length=100, blank=True, null=True)
    previous_school = models.CharField(max_length=255, blank=True, null=True)
    
    # Parent/Guardian Information
    parent_name = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.CharField(max_length=10, choices=RELATIONSHIP_CHOICES, blank=True, null=True)
    parent_phone = models.CharField(max_length=20, blank=True, null=True)
    parent_email = models.EmailField(blank=True, null=True)
    parent_occupation = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    
    # Address Information
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Day Scholar Specific
    bus_route = models.CharField(max_length=100, blank=True, null=True)
    pickup_person = models.CharField(max_length=100, blank=True, null=True)
    pickup_notes = models.TextField(blank=True, null=True)
    
    # Boarding Specific
    hostel = models.CharField(max_length=100, blank=True, null=True)
    dormitory = models.CharField(max_length=100, blank=True, null=True)
    bed_number = models.CharField(max_length=20, blank=True, null=True)
    boarding_since = models.DateField(blank=True, null=True)
    boarding_notes = models.TextField(blank=True, null=True)
    visitation_days = models.CharField(max_length=100, blank=True, null=True)  # Comma-separated
    leave_arrangements = models.CharField(max_length=50, blank=True, null=True)
    
    # Medical Information
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    doctor_info = models.TextField(blank=True, null=True)
    
    # Additional Information
    special_notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # System fields
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['company', 'admission_number']
    
    def save(self, *args, **kwargs):
        if not self.admission_number:
            # Auto-generate admission number if not provided
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
    
    name = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=20, choices=GRADE_LEVELS)
    section = models.CharField(max_length=5, choices=SECTION_CHOICES, default='A')
    
    academic_year = models.CharField(max_length=9)  # e.g., "2024-2025"
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
    academic_year = models.CharField(max_length=9)  # e.g., "2024-2025"
    term = models.CharField(max_length=10, choices=TERM_CHOICES)
    
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
    grade_levels = models.CharField(max_length=200, help_text="Comma-separated grade levels this subject is taught in")
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

