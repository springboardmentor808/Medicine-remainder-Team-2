from django.urls import path

from .views import (
    ReminderListCreateView,
    ReminderDetailView,
    ReminderTakenView,
    ReminderMissedView,
    ReminderSnoozeView,
    TestReminderEmailView,
    MedicationHistoryListView,
    MedicationAdherenceAnalyticsView,
)


urlpatterns = [

    # ========================================================
    # REMINDERS
    # ========================================================

    path(
        "",
        ReminderListCreateView.as_view(),
        name="reminder-list-create"
    ),

    # ========================================================
    # MEDICATION HISTORY
    # ========================================================

    path(
        "history/",
        MedicationHistoryListView.as_view(),
        name="medication-history"
    ),

    # ========================================================
    # ADHERENCE ANALYTICS
    # ========================================================

    path(
        "adherence/",
        MedicationAdherenceAnalyticsView.as_view(),
        name="medication-adherence"
    ),

    # ========================================================
    # REMINDER DETAIL
    # ========================================================

    path(
        "<int:pk>/",
        ReminderDetailView.as_view(),
        name="reminder-detail"
    ),

    # ========================================================
    # MARK AS TAKEN
    # ========================================================

    path(
        "<int:pk>/taken/",
        ReminderTakenView.as_view(),
        name="reminder-taken"
    ),

    # ========================================================
    # MARK AS MISSED
    # ========================================================

    path(
        "<int:pk>/missed/",
        ReminderMissedView.as_view(),
        name="reminder-missed"
    ),

    # ========================================================
    # SNOOZE
    # ========================================================

    path(
        "<int:pk>/snooze/",
        ReminderSnoozeView.as_view(),
        name="reminder-snooze"
    ),

    # ========================================================
    # TEST EMAIL
    # ========================================================

    path(
        "<int:pk>/test-email/",
        TestReminderEmailView.as_view(),
        name="test-reminder-email"
    ),
]