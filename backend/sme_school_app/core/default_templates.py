# Default school document templates with placeholders

DEFAULT_DOCUMENT_TEMPLATES = [
    {
        "name": "Admission Letter",
        "category": "admission",
        "description": "Official admission letter template for new students",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

Dear {{parent_name}},

Subject: Admission of {{student_name}} to {{class}}

We are pleased to inform you that {{student_name}} has been admitted to {{class}} at {{school_name}} for the {{term}} academic year.

Admission Number: {{admission_number}}

Please complete the following formalities within 7 working days of receiving this letter:

1. Payment of admission fee as per the fee structure
2. Submission of birth certificate and medical certificate
3. Completion of admission forms
4. Payment of first term fees

For any queries, please contact the admission office at {{school_phone}} or email {{school_email}}.

Congratulations and we look forward to welcoming {{student_name}} to our school family.

Sincerely,

{{principal_name}}
Principal
{{school_name}}""",
        "is_default": True
    },
    {
        "name": "Transfer Letter",
        "category": "transfer",
        "description": "Student transfer certificate template",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

TRANSFER CERTIFICATE

This is to certify that {{student_name}}, son/daughter of {{parent_name}}, has been a student of this school from {{admission_date}} to {{transfer_date}}.

Academic Details:
- Class: {{class}}
- Roll Number: {{roll_number}}
- Admission Number: {{admission_number}}
- Academic Year: {{academic_year}}

During the period of study, {{student_name}} behaved {{conduct_rating}} and showed {{academic_performance}} academic performance.

Reason for Transfer: {{transfer_reason}}

We wish {{student_name}} all the best in future endeavors.

This certificate is issued on the request of the parent/guardian for transfer purposes.

{{principal_name}}
Principal
{{school_name}}

Seal of the School""",
        "is_default": True
    },
    {
        "name": "Warning Letter",
        "category": "warning",
        "description": "Student disciplinary warning letter",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

WARNING LETTER

To: {{parent_name}}
{{student_name}}
{{class}}
Admission Number: {{admission_number}}

Subject: Disciplinary Warning for {{student_name}}

Dear {{parent_name}},

This letter serves as a formal warning regarding {{student_name}}'s conduct at {{school_name}}.

Details of the incident:
{{incident_description}}

This behavior violates our school conduct policy and is considered {{severity_level}} offense.

Warning Level: {{warning_level}}

Consequences if behavior persists:
{{consequences}}

We expect {{student_name}} to immediately cease this behavior and focus on academics and positive conduct.

We invite you to visit the school for further discussion with the class teacher and counselor.

Please contact us immediately if you have any concerns.

Sincerely,

{{teacher_name}}
Class Teacher

{{principal_name}}
Principal
{{school_name}}""",
        "is_default": True
    },
    {
        "name": "Suspension Letter",
        "category": "suspension",
        "description": "Student suspension notice",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

SUSPENSION NOTICE

To: {{parent_name}}
{{student_name}}
{{class}}
Admission Number: {{admission_number}}

Subject: Suspension from School

Dear {{parent_name}},

This is to inform you that {{student_name}} is hereby suspended from {{school_name}} for a period of {{suspension_days}} days, effective from {{suspension_start}} to {{suspension_end}}.

Reason for Suspension:
{{suspension_reason}}

During the suspension period, {{student_name}} is not permitted to attend any classes, school activities, or access school premises.

Conditions for reinstatement:
1. Complete the suspension period
2. Submit a written apology
3. Written undertaking from you that such behavior will not recur
4. Payment of any applicable fines

Please ensure that {{student_name}} reports to the school office immediately after the suspension period ends, along with this notice and your written confirmation.

For any queries, please contact the school administration.

Sincerely,

{{principal_name}}
Principal
{{school_name}}

Disciplinary Committee""",
        "is_default": True
    },
    {
        "name": "Fee Reminder",
        "category": "fee_reminder",
        "description": "School fee payment reminder letter",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

FEE PAYMENT REMINDER

To: {{parent_name}}
{{student_name}}
{{class}}
Admission Number: {{admission_number}}

Subject: {{reminder_type}} Reminder for Fee Payment

Dear {{parent_name}},

This is a {{reminder_type}} regarding outstanding school fees for {{student_name}}.

Fee Details:
- Term: {{term}}
- Academic Year: {{academic_year}}
- Fee Balance: {{fee_balance}} {{currency}}
- Due Date: {{due_date}}

Breakdown:
{{fee_breakdown}}

Please ensure that the payment is made on or before {{due_date}} via {{payment_methods}}.

For payment:
- Account Number: {{account_number}}
- Bank: {{bank_name}}

Failure to pay by the due date may result in:
- Late payment fees
- Suspension of classes
- Removal from class rolls

For any queries or installment arrangements, please contact our accounts office at {{accounts_phone}} or email {{accounts_email}}.

Thank you for your prompt attention to this matter.

Sincerely,

{{accountant_name}}
Accountant
{{school_name}}""",
        "is_default": True
    },
    {
        "name": "Clearance Certificate",
        "category": "clearance",
        "description": "Student clearance certificate at graduation/leaving",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

STUDENT CLEARANCE CERTIFICATE

This is to certify that {{student_name}}, son/daughter of {{parent_name}}, a student of {{class}}, has satisfactorily completed all requirements for clearance from {{school_name}}.

Details:
- Student Name: {{student_name}}
- Admission Number: {{admission_number}}
- Class: {{class}}
- Academic Period: {{enrollment_period}}
- Date of Clearance: {{clearance_date}}

Clearance Status:

Library Books: ____________________ Date: __________
Laboratory Equipment: _____________ Date: __________
Hostel Property: __________________ Date: __________ (if applicable)
Sports Equipment: ________________ Date: __________
School Uniform/ID: _______________ Date: __________
Fee Balance: _____________________ Date: __________ (Amount: {{fee_balance}})

All accounts have been settled and no dues remain outstanding.

The student has returned all borrowed items and fulfilled all obligations to the school.

This clearance certificate is issued to facilitate further studies or employment.

{{librarian_signature}}
Librarian

{{accountant_signature}}
Accountant

{{principal_signature}}
Principal
{{school_name}}

School Seal""",
        "is_default": True
    },
    {
        "name": "Meeting Invitation",
        "category": "invitation",
        "description": "Notice for parents/teachers meeting",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

MEETING INVITATION

Dear {{recipient_name}},

Subject: Invitation to {{meeting_type}} Meeting

You are cordially invited to attend the {{meeting_type}} scheduled as follows:

Date: {{meeting_date}}
Time: {{meeting_time}}
Venue: {{meeting_venue}}
Topic: {{meeting_agenda}}

The meeting will cover the following important topics:
{{agenda_points}}

Please make every effort to attend this important meeting. Your participation is crucial for:

{{meeting_importance}}

For any queries or if you are unable to attend, please contact {{contact_person}} at {{contact_phone}} or {{contact_email}}.

We look forward to seeing you there.

Sincerely,

{{organizer_name}}
{{organizer_position}}
{{school_name}}

RSVP: {{rsvp_contact}} by {{rsvp_deadline}}""",
        "is_default": True
    },
    {
        "name": "Term Opening/Closing Notice",
        "category": "notice",
        "description": "Notice for term commencement or closure",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

OFFICIAL NOTICE

Subject: {{term}} {{term_status}} - {{academic_year}}

Dear Parents and Guardians,

We are pleased to announce that the {{term}} for academic year {{academic_year}} will {{term_status}} on {{term_date}}.

Important Information:

Commencement Date: {{term_start}}
Closing Date: {{term_end}}
Total School Days: {{school_days}}

Holiday Schedule for {{term}}:
{{holiday_list}}

Important Dates:
{{important_dates}}

School Timings:
- Monday to Friday: {{weekdays_timing}}
- Saturday: {{saturday_timing}}

Please note the following:
{{additional_notes}}

All students must attend school regularly and punctually. Parents are requested to ensure their children:

1. Arrive on time every day
2. Submit pending assignments
3. Clear all outstanding fees
4. Bring required stationery and books

For any concerns, please contact the class teacher or school office.

We wish everyone a productive and successful term!

Sincerely,

{{principal_name}}
Principal
{{school_name}}""",
        "is_default": True
    },
    {
        "name": "Student Recommendation Letter",
        "category": "recommendation",
        "description": "Academic recommendation for further studies",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

LETTER OF RECOMMENDATION

Dear {{recipient_name}},

Subject: Recommendation for {{student_name}} for {{purpose}}

I am writing this recommendation letter on behalf of {{student_name}}, who was a student at {{school_name}} from {{enrollment_start}} to {{completion_date}}.

Academic Performance:
{{academic_performance}}

Strengths and Abilities:
{{strengths}}

Character and Conduct:
{{conduct}}

Extracurricular Activities:
{{activities}}

{{personal_remarks}}

{{student_name}} has demonstrated excellent potential and I am confident that {{he_she}} will excel in {{purpose}}.

If you require any additional information, please contact me directly.

Sincerely,

{{recommendation_giver_name}}
{{recommendation_giver_position}}
{{school_name}}
Phone: {{contact_phone}}
Email: {{contact_email}}""",
        "is_default": True
    },
    {
        "name": "Teacher Employment Contract",
        "category": "employment",
        "description": "Employment contract template for teachers",
        "template_body": """EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is made on {{issue_date}} between:

{{school_name}}
{{school_address}}
Hereinafter referred to as "Employer"

AND

{{teacher_name}}
{{teacher_address}}
Hereinafter referred to as "Employee"

1. POSITIONS AND RESPONSIBILITIES

The Employee is employed as {{position}} in the {{department}} Department.

Primary responsibilities include but are not limited to:
{{responsibilities}}

2. EMPLOYMENT TERM

This contract commences on {{joining_date}} and continues until {{contract_end}} unless terminated earlier according to the provisions herein.

3. COMPENSATION

Salary: {{salary}} {{currency}} per {{salary_period}}
Payment Schedule: {{payment_schedule}}

Benefits:
{{benefits}}

4. WORKING HOURS

Regular working hours: {{working_hours}}
Teaching hours: {{teaching_hours}}

5. LEAVE POLICY

Annual Leave: {{annual_leave}}
Sick Leave: {{sick_leave}}
Other Leave: {{other_leave}}

6. DISCIPLINARY PROCEDURES AND TERMINATION

Termination can occur with {{notice_period}} written notice by either party.

Grounds for immediate termination include:
{{termination_conditions}}

7. CONFIDENTIALITY

The Employee agrees to maintain confidentiality regarding school operations and student information.

8. GOVERNING LAW

This contract is governed by the laws of {{country}}.

Signatures:

Employer: _______________________________ Date: __________
{{school_name}}

Employee: _______________________________ Date: __________
{{teacher_name}}

Witness: _______________________________ Date: __________""",
        "is_default": True
    },
    {
        "name": "Custom Template",
        "category": "custom",
        "description": "Blank template for custom documents",
        "template_body": """{{school_name}}
{{school_address}}

{{issue_date}}

SUBJECT: {{subject}}

Dear {{recipient_name}},

{{body_content}}

{{custom_content}}

Sincerely,

{{sender_name}}
{{sender_position}}
{{school_name}}""",
        "is_default": True
    }
]
