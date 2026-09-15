from django.db import models
from django.contrib.auth.models import User
from medicines.models import Medicine


# ============================================================
# REMINDER
# ============================================================

class Reminder(models.Model):

    # --------------------------------------------------------
    # USER
    # --------------------------------------------------------

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    # --------------------------------------------------------
    # MEDICINE
    # --------------------------------------------------------

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE
    )

    # --------------------------------------------------------
    # REMINDER TIME
    # --------------------------------------------------------

    reminder_time = models.TimeField()

    # --------------------------------------------------------
    # TAKEN STATUS
    # --------------------------------------------------------

    is_taken = models.BooleanField(
        default=False
    )

    # --------------------------------------------------------
    # STATUS
    # Pending / Taken / Missed / Snoozed
    # --------------------------------------------------------

    status = models.CharField(
        max_length=20,
        default="Pending"
    )

    # --------------------------------------------------------
    # REPEATED REMINDER
    # --------------------------------------------------------

    is_repeating = models.BooleanField(
        default=True
    )

    # --------------------------------------------------------
    # REMINDER PERIOD
    # Morning / Afternoon / Night
    # --------------------------------------------------------

    period = models.CharField(
        max_length=20,
        default="Morning"
    )

    # --------------------------------------------------------
    # SNOOZE
    # --------------------------------------------------------

    snoozed_until = models.DateTimeField(
        null=True,
        blank=True
    )

    # --------------------------------------------------------
    # CREATED
    # --------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # --------------------------------------------------------
    # UPDATED
    # --------------------------------------------------------

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):

        return self.medicine.medicine_name


# ============================================================
# MEDICATION HISTORY
# ============================================================

class MedicationHistory(models.Model):

    # --------------------------------------------------------
    # USER
    # --------------------------------------------------------

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    # --------------------------------------------------------
    # MEDICINE
    # --------------------------------------------------------

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE
    )

    # --------------------------------------------------------
    # REMINDER
    # --------------------------------------------------------

    reminder = models.ForeignKey(
        Reminder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # --------------------------------------------------------
    # STATUS
    # Taken / Missed / Snoozed
    # --------------------------------------------------------

    status = models.CharField(
        max_length=20
    )

    # --------------------------------------------------------
    # TIME
    # --------------------------------------------------------

    taken_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.medicine.medicine_name} - "
            f"{self.status}"
        )