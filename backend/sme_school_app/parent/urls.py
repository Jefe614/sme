from django.urls import path

from .views import (
    ParentSendOTPAPIView, ParentVerifyOTPAPIView,
    ParentDashboardAPIView, ParentStudentsAPIView, ParentFeesAPIView,
    ParentResultsAPIView, ParentAttendanceAPIView, ParentAnnouncementsAPIView
)

urlpatterns = [
    # OTP-based authentication
    path('send-otp/', ParentSendOTPAPIView.as_view(), name='parent_send_otp'),
    path('verify-otp/', ParentVerifyOTPAPIView.as_view(), name='parent_verify_otp'),

    # Parent Portal APIs (token-based authentication)
    path('dashboard/', ParentDashboardAPIView.as_view(), name='parent_dashboard'),
    path('students/', ParentStudentsAPIView.as_view(), name='parent_students'),
    path('fees/', ParentFeesAPIView.as_view(), name='parent_fees'),
    path('results/', ParentResultsAPIView.as_view(), name='parent_results'),
    path('attendance/', ParentAttendanceAPIView.as_view(), name='parent_attendance'),
    path('announcements/', ParentAnnouncementsAPIView.as_view(), name='parent_announcements'),
]
