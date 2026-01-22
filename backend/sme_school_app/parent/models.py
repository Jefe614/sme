from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random
import string

class Parent(models.Model):
    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)

    # Authentication
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Parent'
        verbose_name_plural = 'Parents'
        db_table = 'parents'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp_code = ''.join(random.choices(string.digits, k=6))
        from django.utils import timezone
        self.otp_expires_at = timezone.now() + timezone.timedelta(minutes=10)
        self.save()
        return self.otp_code

    def verify_otp(self, otp_code):
        """Verify OTP and return token if valid"""
        from django.utils import timezone
        if (self.otp_code == otp_code and
            self.otp_expires_at and
            timezone.now() <= self.otp_expires_at):
            self.is_verified = True
            self.otp_code = None  # Clear OTP after use
            self.otp_expires_at = None
            self.save()

            # Create or get user for authentication
            user, created = User.objects.get_or_create(
                username=self.phone_number,
                defaults={
                    'first_name': self.first_name,
                    'last_name': self.last_name,
                    'email': self.email or '',
                }
            )

            # Create token
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)
            return token.key
        return None

    @property
    def linked_students(self):
        """Get students linked to this parent"""
        from core.models import Student
        return Student.objects.filter(
            parent_phone=self.phone_number,
            is_active=True
        )


@receiver(post_save, sender='core.Student')
def create_or_update_parent_from_student(sender, instance, **kwargs):
    """Create or update parent record when student is saved with parent info"""
    if instance.parent_phone and instance.parent_name:
        # Split parent name into first and last name
        name_parts = instance.parent_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        parent, created = Parent.objects.get_or_create(
            phone_number=instance.parent_phone,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'email': instance.parent_email or '',
                'is_active': True
            }
        )

        # Update parent info if it changed
        if not created and (parent.first_name != first_name or parent.last_name != last_name):
            parent.first_name = first_name
            parent.last_name = last_name
            parent.email = instance.parent_email or ''
            parent.save()
