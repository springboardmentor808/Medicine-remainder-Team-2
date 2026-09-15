# ============================================================
# IMPORTS
# ============================================================

from datetime import timedelta

from django.utils import timezone

from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reminder, MedicationHistory

from .serializers import (
    ReminderSerializer,
    MedicationHistorySerializer,
)

from .email_service import (
    send_medicine_reminder_email,
)

from medicines.models import Medicine

from notifications.models import Notification


# ============================================================
# CAREGIVER EMERGENCY NOTIFICATION
# ============================================================

def notify_assigned_caregivers(
    patient,
    medicine_name
):
    """
    Create an emergency notification for every active caregiver
    assigned to the patient.
    """

    try:

        from accounts.models import CaregiverPatient

    except ImportError:

        print(
            "CaregiverPatient model could not be imported."
        )

        return 0

    try:

        assignments = (
            CaregiverPatient.objects
            .filter(
                patient=patient,
                is_active=True
            )
            .select_related(
                "caregiver"
            )
        )

    except Exception as error:

        print(
            "Caregiver assignment lookup error:",
            repr(error)
        )

        return 0

    created_count = 0

    for assignment in assignments:

        caregiver = assignment.caregiver

        # ----------------------------------------------------
        # Prevent duplicate unread emergency notifications
        # ----------------------------------------------------

        existing_notification = (
            Notification.objects
            .filter(
                user=caregiver,
                notification_type="emergency",
                is_read=False,
                message__icontains=medicine_name
            )
            .first()
        )

        if existing_notification:

            continue

        # ----------------------------------------------------
        # Create emergency notification
        # ----------------------------------------------------

        Notification.objects.create(
            user=caregiver,
            notification_type="emergency",
            title="Emergency: Missed Medicine",
            message=(
                f"Patient {patient.username} "
                f"missed the medicine "
                f"{medicine_name}. "
                f"Please check on the patient."
            )
        )

        created_count += 1

    return created_count


# ============================================================
# REMINDER LIST + CREATE
# ============================================================

class ReminderListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            Reminder.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "medicine"
            )
            .order_by(
                "reminder_time"
            )
        )

    def perform_create(
        self,
        serializer
    ):

        medicine_id = self.request.data.get(
            "medicine"
        )

        # ----------------------------------------------------
        # Validate medicine ID
        # ----------------------------------------------------

        try:

            medicine_id = int(
                medicine_id
            )

        except (
            TypeError,
            ValueError
        ):

            raise serializers.ValidationError(
                {
                    "medicine":
                        "Valid medicine ID is required."
                }
            )

        # ----------------------------------------------------
        # Make sure medicine belongs to logged-in user
        # ----------------------------------------------------

        try:

            medicine = Medicine.objects.get(
                id=medicine_id,
                user=self.request.user
            )

        except Medicine.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "medicine":
                        "Medicine not found or does not belong to you."
                }
            )

        # ----------------------------------------------------
        # Save reminder
        # ----------------------------------------------------

        serializer.save(
            user=self.request.user,
            medicine=medicine
        )


# ============================================================
# REMINDER DETAIL
# ============================================================

class ReminderDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            Reminder.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "medicine"
            )
        )


# ============================================================
# MARK REMINDER AS TAKEN
# ============================================================

class ReminderTakenView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk
    ):

        reminder = (
            Reminder.objects
            .filter(
                id=pk,
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .first()
        )

        if not reminder:

            return Response(
                {
                    "success": False,
                    "error":
                        "Reminder not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        medicine_name = (
            reminder.medicine.medicine_name
        )

        # ----------------------------------------------------
        # Already taken
        # ----------------------------------------------------

        existing_history = (
            MedicationHistory.objects
            .filter(
                user=request.user,
                reminder=reminder,
                status="Taken"
            )
            .first()
        )

        if existing_history:

            reminder.is_taken = True
            reminder.status = "Taken"
            reminder.snoozed_until = None

            reminder.save(
                update_fields=[
                    "is_taken",
                    "status",
                    "snoozed_until",
                    "updated_at"
                ]
            )

            # ------------------------------------------------
            # Mark medicine notifications as read
            # ------------------------------------------------

            Notification.objects.filter(
                user=request.user,
                notification_type="medicine",
                is_read=False,
                message__icontains=medicine_name
            ).update(
                is_read=True
            )

            return Response(
                {
                    "success": True,

                    "message":
                        "Medicine was already marked as taken.",

                    "reminder_id":
                        reminder.id,

                    "history_id":
                        existing_history.id,

                    "medicine":
                        medicine_name,

                    "status":
                        "Taken",

                    "is_taken":
                        True
                },
                status=status.HTTP_200_OK
            )

        # ----------------------------------------------------
        # Update reminder
        # ----------------------------------------------------

        reminder.is_taken = True
        reminder.status = "Taken"
        reminder.snoozed_until = None

        reminder.save(
            update_fields=[
                "is_taken",
                "status",
                "snoozed_until",
                "updated_at"
            ]
        )

        # ----------------------------------------------------
        # Create history
        # ----------------------------------------------------

        history = MedicationHistory.objects.create(
            user=request.user,
            medicine=reminder.medicine,
            reminder=reminder,
            status="Taken"
        )

        # ----------------------------------------------------
        # Mark medicine reminder notifications as read
        # ----------------------------------------------------

        Notification.objects.filter(
            user=request.user,
            notification_type="medicine",
            is_read=False,
            message__icontains=medicine_name
        ).update(
            is_read=True
        )

        return Response(
            {
                "success": True,

                "message":
                    "Medicine marked as taken.",

                "reminder_id":
                    reminder.id,

                "history_id":
                    history.id,

                "medicine":
                    medicine_name,

                "status":
                    "Taken",

                "is_taken":
                    True
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# MARK REMINDER AS MISSED
# ============================================================

class ReminderMissedView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk
    ):

        # ====================================================
        # FIND REMINDER
        # ====================================================

        reminder = (
            Reminder.objects
            .filter(
                id=pk,
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .first()
        )

        if not reminder:

            return Response(
                {
                    "success": False,
                    "error":
                        "Reminder not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        medicine = reminder.medicine

        medicine_name = (
            medicine.medicine_name
        )

        # ====================================================
        # PREVENT TAKEN -> MISSED
        # ====================================================

        if (
            reminder.is_taken
            or reminder.status == "Taken"
        ):

            return Response(
                {
                    "success": False,

                    "error":
                        "This medicine is already marked as taken."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ====================================================
        # CHECK EXISTING MISSED HISTORY
        # ====================================================

        existing_history = (
            MedicationHistory.objects
            .filter(
                user=request.user,
                reminder=reminder,
                status="Missed"
            )
            .first()
        )

        # ====================================================
        # UPDATE REMINDER
        # ====================================================

        reminder.is_taken = False
        reminder.status = "Missed"
        reminder.snoozed_until = None

        reminder.save(
            update_fields=[
                "is_taken",
                "status",
                "snoozed_until",
                "updated_at"
            ]
        )

        # ====================================================
        # CREATE MISSED HISTORY ONLY ONCE
        # ====================================================

        if existing_history:

            history = existing_history

        else:

            history = MedicationHistory.objects.create(
                user=request.user,
                medicine=medicine,
                reminder=reminder,
                status="Missed"
            )

        # ====================================================
        # PATIENT MISSED MEDICINE NOTIFICATION
        # ====================================================

        notification = (
            Notification.objects
            .filter(
                user=request.user,
                notification_type="missed",
                is_read=False,
                message__icontains=medicine_name
            )
            .first()
        )

        notification_created = False

        if notification:

            notification_id = (
                notification.id
            )

        else:

            notification = Notification.objects.create(
                user=request.user,
                notification_type="missed",
                title="Medicine Missed",
                message=(
                    f"You missed your dose of "
                    f"{medicine_name}. "
                    f"Please check your medication schedule."
                )
            )

            notification_id = (
                notification.id
            )

            notification_created = True

        # ====================================================
        # CAREGIVER EMERGENCY NOTIFICATION
        # ====================================================

        caregiver_notifications = (
            notify_assigned_caregivers(
                request.user,
                medicine_name
            )
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        if existing_history:

            response_message = (
                f"{medicine_name} was already marked as missed."
            )

        else:

            response_message = (
                f"{medicine_name} marked as missed."
            )

        return Response(
            {
                "success": True,

                "message":
                    response_message,

                "reminder_id":
                    reminder.id,

                "history_id":
                    history.id,

                "notification_id":
                    notification_id,

                "notification_created":
                    notification_created,

                "caregiver_notifications":
                    caregiver_notifications,

                "medicine":
                    medicine_name,

                "status":
                    "Missed",

                "is_taken":
                    False
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# SNOOZE REMINDER
# ============================================================

class ReminderSnoozeView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk
    ):

        reminder = (
            Reminder.objects
            .filter(
                id=pk,
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .first()
        )

        if not reminder:

            return Response(
                {
                    "success": False,
                    "error":
                        "Reminder not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------
        # Taken/Missed cannot be snoozed
        # ----------------------------------------------------

        if reminder.status in [
            "Taken",
            "Missed"
        ]:

            return Response(
                {
                    "success": False,
                    "error":
                        "Taken or missed reminders cannot be snoozed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        minutes = request.data.get(
            "minutes",
            10
        )

        try:

            minutes = int(
                minutes
            )

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "success": False,
                    "error":
                        "Snooze minutes must be a number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_minutes = [
            5,
            10,
            15,
            30,
            60
        ]

        if minutes not in allowed_minutes:

            return Response(
                {
                    "success": False,
                    "error":
                        "Snooze duration must be 5, 10, 15, 30 or 60 minutes."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        snoozed_until = (
            timezone.now()
            + timedelta(
                minutes=minutes
            )
        )

        reminder.is_taken = False
        reminder.status = "Snoozed"
        reminder.snoozed_until = snoozed_until

        reminder.save(
            update_fields=[
                "is_taken",
                "status",
                "snoozed_until",
                "updated_at"
            ]
        )

        return Response(
            {
                "success": True,

                "message":
                    f"Reminder snoozed for {minutes} minutes.",

                "reminder_id":
                    reminder.id,

                "medicine":
                    reminder.medicine.medicine_name,

                "status":
                    "Snoozed",

                "snoozed_until":
                    reminder.snoozed_until,

                "snooze_minutes":
                    minutes
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# MEDICATION HISTORY
# ============================================================

class MedicationHistoryListView(
    generics.ListAPIView
):

    serializer_class = MedicationHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            MedicationHistory.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "medicine",
                "reminder"
            )
            .order_by(
                "-taken_at"
            )
        )


# ============================================================
# MEDICATION ADHERENCE ANALYTICS
# ============================================================

class MedicationAdherenceAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request
    ):

        user = request.user

        now = timezone.localtime()

        today = now.date()

        last_7_days = (
            today -
            timedelta(days=6)
        )

        last_30_days = (
            today -
            timedelta(days=29)
        )

        history = (
            MedicationHistory.objects
            .filter(
                user=user
            )
            .select_related(
                "medicine",
                "reminder"
            )
        )

        # ====================================================
        # OVERALL
        # ====================================================

        total_taken = history.filter(
            status="Taken"
        ).count()

        total_missed = history.filter(
            status="Missed"
        ).count()

        total_snoozed = history.filter(
            status="Snoozed"
        ).count()

        completed_doses = (
            total_taken +
            total_missed
        )

        if completed_doses:

            overall_adherence = round(
                (
                    total_taken /
                    completed_doses
                ) * 100,
                2
            )

        else:

            overall_adherence = 0

        # ====================================================
        # TODAY
        # ====================================================

        today_history = history.filter(
            taken_at__date=today
        )

        today_taken = today_history.filter(
            status="Taken"
        ).count()

        today_missed = today_history.filter(
            status="Missed"
        ).count()

        today_snoozed = today_history.filter(
            status="Snoozed"
        ).count()

        today_completed = (
            today_taken +
            today_missed
        )

        if today_completed:

            today_adherence = round(
                (
                    today_taken /
                    today_completed
                ) * 100,
                2
            )

        else:

            today_adherence = 0

        # ====================================================
        # WEEKLY
        # ====================================================

        weekly_history = history.filter(
            taken_at__date__gte=last_7_days,
            taken_at__date__lte=today
        )

        weekly_taken = weekly_history.filter(
            status="Taken"
        ).count()

        weekly_missed = weekly_history.filter(
            status="Missed"
        ).count()

        weekly_snoozed = weekly_history.filter(
            status="Snoozed"
        ).count()

        weekly_completed = (
            weekly_taken +
            weekly_missed
        )

        if weekly_completed:

            weekly_adherence = round(
                (
                    weekly_taken /
                    weekly_completed
                ) * 100,
                2
            )

        else:

            weekly_adherence = 0

        # ====================================================
        # MONTHLY
        # ====================================================

        monthly_history = history.filter(
            taken_at__date__gte=last_30_days,
            taken_at__date__lte=today
        )

        monthly_taken = monthly_history.filter(
            status="Taken"
        ).count()

        monthly_missed = monthly_history.filter(
            status="Missed"
        ).count()

        monthly_snoozed = monthly_history.filter(
            status="Snoozed"
        ).count()

        monthly_completed = (
            monthly_taken +
            monthly_missed
        )

        if monthly_completed:

            monthly_adherence = round(
                (
                    monthly_taken /
                    monthly_completed
                ) * 100,
                2
            )

        else:

            monthly_adherence = 0

        # ====================================================
        # DAILY TREND
        # ====================================================

        daily_trend = []

        for i in range(7):

            current_date = (
                today -
                timedelta(
                    days=6 - i
                )
            )

            day_history = history.filter(
                taken_at__date=current_date
            )

            taken = day_history.filter(
                status="Taken"
            ).count()

            missed = day_history.filter(
                status="Missed"
            ).count()

            snoozed = day_history.filter(
                status="Snoozed"
            ).count()

            completed = (
                taken +
                missed
            )

            if completed:

                adherence = round(
                    (
                        taken /
                        completed
                    ) * 100,
                    2
                )

            else:

                adherence = 0

            daily_trend.append(
                {
                    "date":
                        current_date.isoformat(),

                    "taken":
                        taken,

                    "missed":
                        missed,

                    "snoozed":
                        snoozed,

                    "total":
                        completed,

                    "adherence":
                        adherence
                }
            )

        # ====================================================
        # MEDICINE-WISE ANALYSIS
        # ====================================================

        medicine_analysis = []

        medicine_ids = (
            history
            .values_list(
                "medicine_id",
                flat=True
            )
            .distinct()
        )

        for medicine_id in medicine_ids:

            medicine_history = history.filter(
                medicine_id=medicine_id
            )

            first_record = (
                medicine_history.first()
            )

            if not first_record:
                continue

            medicine = (
                first_record.medicine
            )

            taken = medicine_history.filter(
                status="Taken"
            ).count()

            missed = medicine_history.filter(
                status="Missed"
            ).count()

            snoozed = medicine_history.filter(
                status="Snoozed"
            ).count()

            completed = (
                taken +
                missed
            )

            if completed:

                adherence = round(
                    (
                        taken /
                        completed
                    ) * 100,
                    2
                )

            else:

                adherence = 0

            medicine_analysis.append(
                {
                    "medicine_id":
                        medicine.id,

                    "medicine_name":
                        medicine.medicine_name,

                    "taken":
                        taken,

                    "missed":
                        missed,

                    "snoozed":
                        snoozed,

                    "total":
                        completed,

                    "adherence":
                        adherence
                }
            )

        # ====================================================
        # MISSED DOSE ANALYSIS
        # ====================================================

        missed_history = history.filter(
            status="Missed"
        )

        missed_analysis = []

        missed_medicine_ids = (
            missed_history
            .values_list(
                "medicine_id",
                flat=True
            )
            .distinct()
        )

        for medicine_id in missed_medicine_ids:

            medicine_missed = (
                missed_history
                .filter(
                    medicine_id=medicine_id
                )
            )

            first_missed = (
                medicine_missed.first()
            )

            if not first_missed:
                continue

            missed_count = (
                medicine_missed.count()
            )

            medicine_total = (
                history
                .filter(
                    medicine_id=medicine_id
                )
                .filter(
                    status__in=[
                        "Taken",
                        "Missed"
                    ]
                )
                .count()
            )

            if medicine_total:

                missed_percentage = round(
                    (
                        missed_count /
                        medicine_total
                    ) * 100,
                    2
                )

            else:

                missed_percentage = 0

            missed_analysis.append(
                {
                    "medicine_id":
                        first_missed.medicine.id,

                    "medicine_name":
                        first_missed.medicine.medicine_name,

                    "missed":
                        missed_count,

                    "percentage":
                        missed_percentage
                }
            )

        # ====================================================
        # RESPONSE
        # ====================================================

        return Response(
            {
                "summary": {
                    "total":
                        completed_doses,

                    "taken":
                        total_taken,

                    "missed":
                        total_missed,

                    "snoozed":
                        total_snoozed,

                    "adherence":
                        overall_adherence
                },

                "today": {
                    "total":
                        today_completed,

                    "taken":
                        today_taken,

                    "missed":
                        today_missed,

                    "snoozed":
                        today_snoozed,

                    "adherence":
                        today_adherence
                },

                "weekly": {
                    "total":
                        weekly_completed,

                    "taken":
                        weekly_taken,

                    "missed":
                        weekly_missed,

                    "snoozed":
                        weekly_snoozed,

                    "adherence":
                        weekly_adherence
                },

                "monthly": {
                    "total":
                        monthly_completed,

                    "taken":
                        monthly_taken,

                    "missed":
                        monthly_missed,

                    "snoozed":
                        monthly_snoozed,

                    "adherence":
                        monthly_adherence
                },

                "daily_trend":
                    daily_trend,

                "medicine_analysis":
                    medicine_analysis,

                "missed_analysis":
                    missed_analysis
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# TEST REMINDER EMAIL
# ============================================================

class TestReminderEmailView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        pk
    ):

        reminder = (
            Reminder.objects
            .filter(
                id=pk,
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .first()
        )

        if not reminder:

            return Response(
                {
                    "success": False,
                    "error":
                        "Reminder not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            send_medicine_reminder_email(
                request.user,
                reminder
            )

            return Response(
                {
                    "success": True,
                    "message":
                        "Reminder email sent successfully."
                },
                status=status.HTTP_200_OK
            )

        except Exception as error:

            print(
                "EMAIL ERROR:",
                repr(error)
            )

            return Response(
                {
                    "success": False,
                    "error":
                        str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )