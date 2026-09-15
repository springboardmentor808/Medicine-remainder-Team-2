from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # ============================================================
    # ADMIN
    # ============================================================

    path(
        "admin/",
        admin.site.urls
    ),


    # ============================================================
    # JWT AUTHENTICATION
    # ============================================================

    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),


    # ============================================================
    # ACCOUNTS
    # ============================================================

    path(
        "api/accounts/",
        include("accounts.urls")
    ),


    # ============================================================
    # MEDICINES
    # ============================================================

    path(
        "api/medicines/",
        include("medicines.urls")
    ),


    # ============================================================
    # REMINDERS
    # ============================================================

    path(
        "api/reminders/",
        include("reminders.urls")
    ),


    # ============================================================
    # ML ADHERENCE PREDICTION
    # ============================================================

    path(
        "api/ml/",
        include("ml.urls")
    ),


    # ============================================================
    # REFILL PREDICTION
    # ============================================================

    path(
        "api/refill/",
        include("refill.urls")
    ),


    # ============================================================
    # SMART NOTIFICATIONS
    # MODULE 8
    # ============================================================

    path(
        "api/notifications/",
        include("notifications.urls")
    ),
]