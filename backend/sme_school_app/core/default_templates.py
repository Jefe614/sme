# Default school document templates with fillable blanks

DEFAULT_DOCUMENT_TEMPLATES = [
    {
        "name": "Admission Letter",
        "category": "admission",
        "description": "Official admission letter template for new students",
        "template_body": """______________________________
______________________________
______________________________

______________________________

Dear ______________________________,

Subject: Admission of ______________________________ to ______________________________

We are pleased to inform you that ______________________________ has been admitted to ______________________________ at ______________________________ for the ______________________________ academic year.

Admission Number: ______________________________

Please complete the following formalities within 7 working days of receiving this letter:

1. Payment of admission fee as per the fee structure
2. Submission of birth certificate and medical certificate
3. Completion of admission forms
4. Payment of first term fees

For any queries, please contact the admission office at ______________________________ or email ______________________________.

Congratulations and we look forward to welcoming ______________________________ to our school family.

Sincerely,

______________________________
Principal
______________________________""",
        "is_default": True
    },
    {
        "name": "Transfer Letter",
        "category": "transfer",
        "description": "Student transfer certificate template",
        "template_body": """______________________________
______________________________

______________________________

TRANSFER CERTIFICATE

This is to certify that ______________________________, son/daughter of ______________________________, has been a student of this school from ______________________________ to ______________________________.

Academic Details:
- Class: ______________________________
- Roll Number: ______________________________
- Admission Number: ______________________________
- Academic Year: ______________________________

During the period of study, ______________________________ behaved ______________________________ and showed ______________________________ academic performance.

Reason for Transfer: ______________________________

We wish ______________________________ all the best in future endeavors.

This certificate is issued on the request of the parent/guardian for transfer purposes.

______________________________
Principal
______________________________

Seal of the School""",
        "is_default": True
    },
    {
        "name": "Warning Letter",
        "category": "warning",
        "description": "Student disciplinary warning letter",
        "template_body": """______________________________
______________________________

______________________________

WARNING LETTER

To: ______________________________
______________________________
______________________________
Admission Number: ______________________________

Subject: Disciplinary Warning for ______________________________

Dear ______________________________,

This letter serves as a formal warning regarding ______________________________'s conduct at ______________________________.

Details of the incident:
______________________________

This behavior violates our school conduct policy and is considered ______________________________ offense.

Warning Level: ______________________________

Consequences if behavior persists:
______________________________

We expect ______________________________ to immediately cease this behavior and focus on academics and positive conduct.

We invite you to visit the school for further discussion with the class teacher and counselor.

Please contact us immediately if you have any concerns.

Sincerely,

______________________________
Class Teacher

______________________________
Principal
______________________________""",
        "is_default": True
    },
    {
        "name": "Suspension Letter",
        "category": "suspension",
        "description": "Student suspension notice",
        "template_body": """______________________________
______________________________

______________________________

SUSPENSION NOTICE

To: ______________________________
______________________________
______________________________
Admission Number: ______________________________

Subject: Suspension from School

Dear ______________________________,

This is to inform you that ______________________________ is hereby suspended from ______________________________ for a period of ______________________________ days, effective from ______________________________ to ______________________________.

Reason for Suspension:
______________________________

During the suspension period, ______________________________ is not permitted to attend any classes, school activities, or access school premises.

Conditions for reinstatement:
1. Complete the suspension period
2. Submit a written apology
3. Written undertaking from you that such behavior will not recur
4. Payment of any applicable fines

Please ensure that ______________________________ reports to the school office immediately after the suspension period ends, along with this notice and your written confirmation.

For any queries, please contact the school administration.

Sincerely,

______________________________
Principal
______________________________

Disciplinary Committee""",
        "is_default": True
    },
    {
        "name": "Fee Reminder",
        "category": "fee_reminder",
        "description": "School fee payment reminder letter",
        "template_body": """______________________________
______________________________

______________________________

FEE PAYMENT REMINDER

To: ______________________________
______________________________
______________________________
Admission Number: ______________________________

Subject: ______________________________ Reminder for Fee Payment

Dear ______________________________,

This is a ______________________________ regarding outstanding school fees for ______________________________.

Fee Details:
- Term: ______________________________
- Academic Year: ______________________________
- Fee Balance: ______________________________ ______________________________
- Due Date: ______________________________

Breakdown:
______________________________

Please ensure that the payment is made on or before ______________________________ via ______________________________.

For payment:
- Account Number: ______________________________
- Bank: ______________________________

Failure to pay by the due date may result in:
- Late payment fees
- Suspension of classes
- Removal from class rolls

For any queries or installment arrangements, please contact our accounts office at ______________________________ or email ______________________________.

Thank you for your prompt attention to this matter.

Sincerely,

______________________________
Accountant
______________________________""",
        "is_default": True
    },
    {
        "name": "Clearance Certificate",
        "category": "clearance",
        "description": "Student clearance certificate at graduation/leaving",
        "template_body": """______________________________
______________________________

______________________________

STUDENT CLEARANCE CERTIFICATE

This is to certify that ______________________________, son/daughter of ______________________________, a student of ______________________________, has satisfactorily completed all requirements for clearance from ______________________________.

Details:
- Student Name: ______________________________
- Admission Number: ______________________________
- Class: ______________________________
- Academic Period: ______________________________
- Date of Clearance: ______________________________

Clearance Status:

Library Books: ____________________ Date: __________
Laboratory Equipment: _____________ Date: __________
Hostel Property: __________________ Date: __________ (if applicable)
Sports Equipment: ________________ Date: __________
School Uniform/ID: _______________ Date: __________
Fee Balance: _____________________ Date: __________ (Amount: ______________________________)

All accounts have been settled and no dues remain outstanding.

The student has returned all borrowed items and fulfilled all obligations to the school.

This clearance certificate is issued to facilitate further studies or employment.

______________________________
Librarian

______________________________
Accountant

______________________________
Principal
______________________________

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
