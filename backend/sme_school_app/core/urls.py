from django.urls import path
from .views import (
    CompanyAPIView, LoginAPIView, SchoolDashboardSummaryAPIView, SignupAPIView, StaffAPIView,
    StudentClassView, TeacherAPIView, TransactionAPIView, StudentAPIView, NotificationAPIView, FeeReminderNotificationAPIView,
    ForgotPasswordAPIView, ResetPasswordAPIView
)
from .fees import FeeStructureAPIView, FeePaymentAPIView, FeeDiscountAPIView, FeeReportingAPIView
from .documents import DocumentTemplateAPIView, DocumentTemplateDetailAPIView, TemplateCategoriesAPIView, GenerateDocumentAPIView, DownloadDocumentAPIView
from .bulk_import import BulkImportStudentsAPIView, DownloadStudentTemplateAPIView
from .academic import AcademicYearAPIView, TermAPIView, ClassSubjectAssignmentAPIView, SubjectAPIView
from .exams import (
    GradingSystemAPIView, ExamAPIView, ExamLockAPIView, ExamMarkAPIView,
    BulkExamMarkAPIView, StudentReportCardAPIView, ClassPerformanceAPIView,
    ExamStatisticsAPIView
)

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("companies", CompanyAPIView.as_view(), name="companies"),
    path("transactions", TransactionAPIView.as_view(), name="transactions"),
    path("students", StudentAPIView.as_view(), name="students"),
    path("students/<int:pk>/", StudentAPIView.as_view(), name="student-detail"),
    path("students/bulk-import/", BulkImportStudentsAPIView.as_view(), name="bulk-import-students"),
    path("students/download-template/", DownloadStudentTemplateAPIView.as_view(), name="download-student-template"),
    path("classes", StudentClassView.as_view(), name="classes"),
    path('staff/', StaffAPIView.as_view(), name='staff-list-create'),
    path('staff/<int:pk>/', StaffAPIView.as_view(), name='staff-detail-update-delete'),
    path('teachers/', TeacherAPIView.as_view(), name='teachers-list'),
    path('teachers/', TeacherAPIView.as_view(), name='teachers-list'),
    path('school-dashboard-summary/', SchoolDashboardSummaryAPIView.as_view(), name='school-dashboard-summary'),

    # Academic Management URLs
    path("academic-years/", AcademicYearAPIView.as_view(), name="academic-years"),
    path("academic-years/<int:pk>/", AcademicYearAPIView.as_view(), name="academic-year-detail"),
    path("terms/", TermAPIView.as_view(), name="terms"),
    path("terms/<int:pk>/", TermAPIView.as_view(), name="term-detail"),
    path("subjects/", SubjectAPIView.as_view(), name="subjects"),
    path("subjects/<int:pk>/", SubjectAPIView.as_view(), name="subject-detail"),
    path("class-subject-assignments/", ClassSubjectAssignmentAPIView.as_view(), name="class-subject-assignments"),
    path("class-subject-assignments/<int:pk>/", ClassSubjectAssignmentAPIView.as_view(), name="class-subject-assignment-detail"),

    # Fee Management URLs
    path("fee-structures/", FeeStructureAPIView.as_view(), name="fee-structures"),
    path("fee-structures/<int:pk>/", FeeStructureAPIView.as_view(), name="fee-structure-detail"),
    path("fee-payments/", FeePaymentAPIView.as_view(), name="fee-payments"),
    path("fee-payments/<int:pk>/", FeePaymentAPIView.as_view(), name="fee-payment-detail"),
    path("fee-discounts/", FeeDiscountAPIView.as_view(), name="fee-discounts"),
    path("fee-discounts/<int:pk>/", FeeDiscountAPIView.as_view(), name="fee-discount-detail"),
    path("fee-reports/", FeeReportingAPIView.as_view(), name="fee-reports"),

    # Document Template URLs
    path("templates/", DocumentTemplateAPIView.as_view(), name="templates"),
    path("templates/<int:template_id>/", DocumentTemplateDetailAPIView.as_view(), name="template-detail"),
    path("templates/<int:template_id>/download/", DownloadDocumentAPIView.as_view(), name="download-template"),
    path("template-categories/", TemplateCategoriesAPIView.as_view(), name="template-categories"),
    path("generate-document/", GenerateDocumentAPIView.as_view(), name="generate-document"),


    path("notifications/", NotificationAPIView.as_view(), name="notifications"),
    path("notifications/send/", NotificationAPIView.as_view(), name="send-notifications"),
    path("notifications/fee-reminders/", FeeReminderNotificationAPIView.as_view(), name="fee-reminders"),

    # Exam Management URLs
    path("grading-systems/", GradingSystemAPIView.as_view(), name="grading-systems"),
    path("grading-systems/<int:pk>/", GradingSystemAPIView.as_view(), name="grading-system-detail"),
    path("exams/", ExamAPIView.as_view(), name="exams"),
    path("exams/<int:pk>/", ExamAPIView.as_view(), name="exam-detail"),
    path("exams/<int:pk>/lock/", ExamLockAPIView.as_view(), name="exam-lock"),
    path("exam-marks/", ExamMarkAPIView.as_view(), name="exam-marks"),
    path("exam-marks/<int:pk>/", ExamMarkAPIView.as_view(), name="exam-mark-detail"),
    path("exam-marks/bulk/", BulkExamMarkAPIView.as_view(), name="bulk-exam-marks"),

    # Reports and Analytics URLs
    path("reports/student-report-card/", StudentReportCardAPIView.as_view(), name="student-report-card"),
    path("reports/class-performance/", ClassPerformanceAPIView.as_view(), name="class-performance"),
    path("reports/exam-statistics/", ExamStatisticsAPIView.as_view(), name="exam-statistics"),

    # Password Reset URLs
    path("forgot-password/", ForgotPasswordAPIView.as_view(), name="forgot-password"),
    path("reset-password/<str:uidb64>/<str:token>/", ResetPasswordAPIView.as_view(), name="reset-password"),
]
