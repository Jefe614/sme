from django.urls import path
from .views import (
    AttendanceMarkingAPIView, ClassAttendanceDataAPIView, TeacherClassesAPIView
)

app_name = 'teachers'

urlpatterns = [
    # Teacher Attendance APIs (Mobile-ready)
    path("attendance/mark/", AttendanceMarkingAPIView.as_view(), name="attendance-mark"),
    path("attendance/mark/<int:pk>/", AttendanceMarkingAPIView.as_view(), name="attendance-update"),
    path("attendance/class-data/", ClassAttendanceDataAPIView.as_view(), name="class-attendance-data"),
    path("classes/", TeacherClassesAPIView.as_view(), name="teacher-classes"),
]
