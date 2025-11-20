from django.urls import path
from .views import ParentMobileLoginAPIView, SetParentPasswordAPIView

urlpatterns = [
    path('parent/login/', ParentMobileLoginAPIView.as_view(), name='parent_mobile_login'),
    path('set-password/', SetParentPasswordAPIView.as_view(), name='set_parent_password'),
]
