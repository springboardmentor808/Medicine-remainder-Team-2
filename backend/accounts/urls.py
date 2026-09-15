from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterAPIView,
    LoginAPIView,
    ProfileView,
    ChangePasswordAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    LogoutAPIView,
    AdminTestAPIView,
    CaregiverPatientAssignmentAPIView,
    CaregiverAssignedPatientsAPIView,
    CaregiverPatientDetailsAPIView,
)


urlpatterns = [

    # ========================================================
    # USER REGISTRATION
    # ========================================================

    path(
        "register/",
        RegisterAPIView.as_view(),
        name="register"
    ),

    # ========================================================
    # USER LOGIN
    # ========================================================

    path(
        "login/",
        LoginAPIView.as_view(),
        name="login"
    ),

    # ========================================================
    # JWT TOKEN REFRESH
    # ========================================================

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh"
    ),

    # ========================================================
    # USER PROFILE
    # ========================================================

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile"
    ),

    # ========================================================
    # CHANGE PASSWORD
    # ========================================================

    path(
        "change-password/",
        ChangePasswordAPIView.as_view(),
        name="change-password"
    ),

    # ========================================================
    # FORGOT PASSWORD
    # ========================================================

    path(
        "forgot-password/",
        ForgotPasswordAPIView.as_view(),
        name="forgot-password"
    ),

    # ========================================================
    # RESET PASSWORD
    # ========================================================

    path(
        "reset-password/",
        ResetPasswordAPIView.as_view(),
        name="reset-password"
    ),

    # ========================================================
    # LOGOUT
    # ========================================================

    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout"
    ),

    # ========================================================
    # ADMIN TEST
    # ========================================================

    path(
        "admin-test/",
        AdminTestAPIView.as_view(),
        name="admin-test"
    ),

    # ========================================================
    # ADMIN - CAREGIVER/PATIENT ASSIGNMENT
    # ========================================================

    path(
        "caregiver-assignments/",
        CaregiverPatientAssignmentAPIView.as_view(),
        name="caregiver-assignments"
    ),

    # ========================================================
    # CAREGIVER - VIEW ALL ASSIGNED PATIENTS
    # ========================================================

    path(
        "caregiver/assigned-patients/",
        CaregiverAssignedPatientsAPIView.as_view(),
        name="caregiver-assigned-patients"
    ),

    # ========================================================
    # CAREGIVER - VIEW ONE ASSIGNED PATIENT DETAILS
    # ========================================================

    path(
        "caregiver/patient/<int:patient_id>/",
        CaregiverPatientDetailsAPIView.as_view(),
        name="caregiver-patient-details"
    ),
]