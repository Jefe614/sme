import africastalking
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def initialize_africastalking():
    """Initialize Africa's Talking SDK"""
    try:
        africastalking.initialize(
            username=settings.AFRICA_SMS_USERNAME,
            api_key=settings.AFRICA_SMS_API_KEY
        )
        return africastalking.SMS
    except Exception as e:
        logger.error(f"Failed to initialize Africa's Talking: {str(e)}")
        return None

def send_sms(recipients, message, sender_id=None):
    """
    Send SMS using Africa's Talking

    Args:
        recipients (list): List of phone numbers (e.g., ['+254712345678'])
        message (str): SMS message content
        sender_id (str): Sender ID (optional, uses default from settings)

    Returns:
        dict: Response with success status and details
    """
    try:
        sms = initialize_africastalking()
        if not sms:
            return {
                'success': False,
                'error': 'SMS service not initialized',
                'message': 'Failed to initialize SMS service'
            }

        # Ensure recipients is a list
        if isinstance(recipients, str):
            recipients = [recipients]

        # Format phone numbers (ensure they start with +)
        formatted_recipients = []
        for recipient in recipients:
            if not recipient.startswith('+'):
                # Assume Kenyan numbers without + are 07XXXXXXXX format
                if recipient.startswith('07') and len(recipient) == 10:
                    recipient = '+254' + recipient[1:]
                elif recipient.startswith('01') and len(recipient) == 9:
                    recipient = '+254' + recipient[1:]
                else:
                    recipient = '+' + recipient
            formatted_recipients.append(recipient)

        # Use sender_id from settings if not provided
        sender = sender_id or settings.SENDER_ID

        # Send SMS
        response = sms.send(message, formatted_recipients, sender)

        logger.info(f"SMS sent successfully to {formatted_recipients}: {response}")

        return {
            'success': True,
            'response': response,
            'recipients': formatted_recipients,
            'message': message
        }

    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send SMS'
        }

def send_otp_sms(phone_number, otp_code, school_name="School"):
    """
    Send OTP SMS to parent

    Args:
        phone_number (str): Parent's phone number
        otp_code (str): 6-digit OTP code
        school_name (str): Name of the school (optional)

    Returns:
        dict: SMS sending result
    """
    message = f"Your {school_name} Parent Portal verification code is: {otp_code}. This code expires in 10 minutes."

    return send_sms([phone_number], message)
