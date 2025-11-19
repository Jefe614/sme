from django.urls import path
from .views import CompanyAPIView, LoginAPIView, SchoolDashboardSummaryAPIView, SignupAPIView, StaffAPIView, StudentClassView, TeacherAPIView, TransactionAPIView, StudentAPIView
from .fees import FeeStructureAPIView, FeePaymentAPIView, FeeDiscountAPIView, FeeReportingAPIView
from .documents import DocumentTemplateAPIView, DocumentTemplateDetailAPIView, TemplateCategoriesAPIView, GenerateDocumentAPIView

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("companies", CompanyAPIView.as_view(), name="companies"),
    path("transactions", TransactionAPIView.as_view(), name="transactions"),
    path("students", StudentAPIView.as_view(), name="students"),
    path("classes", StudentClassView.as_view(), name="classes"),
    path('staff/', StaffAPIView.as_view(), name='staff-list-create'),
    path('staff/<int:pk>/', StaffAPIView.as_view(), name='staff-detail-update-delete'),
    path('teachers/', TeacherAPIView.as_view(), name='teachers-list'),
    path('teachers/', TeacherAPIView.as_view(), name='teachers-list'),
    path('school-dashboard-summary/', SchoolDashboardSummaryAPIView.as_view(), name='school-dashboard-summary'),

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
    path("template-categories/", TemplateCategoriesAPIView.as_view(), name="template-categories"),
    path("generate-document/", GenerateDocumentAPIView.as_view(), name="generate-document"),
]
