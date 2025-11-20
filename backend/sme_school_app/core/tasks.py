# tasks.py
from celery import shared_task
import africastalking
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Notification, Student
from django.db import transaction


# Initialize Africa's Talking SMS service
sms = africastalking.SMS


@shared_task
def send_email_notification(notification_id):
    """Send email notification"""
    try:
        with transaction.atomic():
            notification = Notification.objects.select_for_update().get(id=notification_id)

            if notification.status != 'pending' or notification.notification_type != 'email':
                return f"Notification {notification_id} already processed or not email type"

            # Send email
            send_mail(
                subject=notification.subject,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient_email],
                fail_silently=False,
            )

            # Update status
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save()

            return f"Email sent successfully to {notification.recipient_email}"

    except Exception as e:
        notification.status = 'failed'
        notification.error_message = str(e)
        notification.save()
        raise e


@shared_task
def send_sms_notification(notification_id):
    """Send SMS notification using Africa's Talking"""
    try:
        with transaction.atomic():
            notification = Notification.objects.select_for_update().get(id=notification_id)

            if notification.status != 'pending' or notification.notification_type != 'sms':
                return f"Notification {notification_id} already processed or not SMS type"

            # Initialize Africa's Talking
            africastalking.initialize(
                username=settings.AFRICA_SMS_USERNAME,
                api_key=settings.AFRICA_SMS_API_KEY
            )

            # Send SMS
            recipients = [notification.recipient_phone]
            response = sms.send(notification.message, recipients, sender_id=settings.SENDER_ID)

            # Check if SMS was sent successfully
            if response['SMSMessageData']['Recipients'][0]['status'] == 'Success':
                notification.status = 'delivered'
            else:
                notification.status = 'sent'  # Sent but delivery pending

            notification.sent_at = timezone.now()
            notification.save()

            return f"SMS sent successfully to {notification.recipient_phone}"

    except Exception as e:
        notification.status = 'failed'
        notification.error_message = str(e)
        notification.save()
        raise e


@shared_task
def send_bulk_notifications(student_ids, notification_type, subject, message, sent_by_id=None):
    """Send bulk notifications to parents of multiple students"""
    students = Student.objects.filter(id__in=student_ids)
    notification_count = 0

    for student in students:
        # Use student parent contact information
        if notification_type == 'email' and student.parent_email:
            notification = Notification.objects.create(
                company=student.company,
                notification_type='email',
                subject=subject,
                message=message,
                student=student,
                recipient_email=student.parent_email,
                priority='medium',
                sent_by_id=sent_by_id,
            )
            send_email_notification.delay(notification.id)
            notification_count += 1

        elif notification_type == 'sms' and student.parent_phone:
            notification = Notification.objects.create(
                company=student.company,
                notification_type='sms',
                subject=subject,
                message=message,
                student=student,
                recipient_phone=student.parent_phone,
                priority='medium',
                sent_by_id=sent_by_id,
            )
            send_sms_notification.delay(notification.id)
            notification_count += 1

    return f"Queued {notification_count} {notification_type} notifications for parents of {len(student_ids)} students"


@shared_task
def send_fee_reminder_notifications():
    """Send fee reminder notifications to parents of students with pending fees"""
    from .models import FeePayment, Student

    # Find students with pending fees
    pending_students = FeePayment.objects.filter(
        balance__gt=0,
        fee_structure__due_date__lt=timezone.now().date()
    ).select_related('student', 'fee_structure').distinct('student')

    sent_count = 0

    for fee_payment in pending_students:
        student = fee_payment.student

        # Check if parent contact info exists in student record
        if not student.parent_phone and not student.parent_email:
            continue

        # Create notification
        subject = f"Fee Payment Reminder for {student.get_full_name()}"
        message = f"""
Dear {student.parent_name},

This is a reminder that fees for {student.get_full_name()} (Admission No: {student.admission_number}) are pending.

Amount Due: KES {fee_payment.balance}
Due Date: {fee_payment.fee_structure.due_date}

Please ensure payment is made as soon as possible to avoid penalties.

Regards,
{student.company.name}
        """.strip()

        # Send SMS if phone number available
        if student.parent_phone:
            notification = Notification.objects.create(
                company=student.company,
                notification_type='sms',
                subject=subject,
                message=message[:160],  # SMS length limit
                student=student,
                recipient_phone=student.parent_phone,
                priority='high',
            )
            send_sms_notification.delay(notification.id)
            sent_count += 1

        # Send email if email available
        if student.parent_email:
            email_message = f"""
Dear {student.parent_name},

This is a reminder that fees for {student.get_full_name()} (Admission No: {student.admission_number}) are pending.

Amount Due: KES {fee_payment.balance:,.2f}
Due Date: {fee_payment.fee_structure.due_date}

Please ensure payment is made as soon as possible to avoid penalties.

You can make payment through:
- Online portal
- MPesa to [PAYBILL NUMBER]
- Bank transfer to [ACCOUNT DETAILS]

Regards,
{student.company.name}
Administrator
            """.strip()

            notification = Notification.objects.create(
                company=student.company,
                notification_type='email',
                subject=subject,
                message=email_message,
                student=student,
                recipient_email=student.parent_email,
                priority='high',
            )
            send_email_notification.delay(notification.id)
            sent_count += 1

    return f"Sent fee reminders to {sent_count} parents"
