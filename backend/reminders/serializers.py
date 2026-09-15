from rest_framework import serializers

from .models import (
    Reminder,
    MedicationHistory
)


# ============================================================
# REMINDER SERIALIZER
# ============================================================

class ReminderSerializer(serializers.ModelSerializer):

    medicine_name = serializers.CharField(
        source="medicine.medicine_name",
        read_only=True
    )

    class Meta:

        model = Reminder

        fields = [
            "id",
            "user",
            "medicine",
            "medicine_name",

            # Reminder timing
            "reminder_time",
            "is_repeating",
            "period",

            # Reminder status
            "is_taken",
            "status",
            "snoozed_until",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "medicine_name",
            "is_taken",
            "status",
            "created_at",
            "updated_at",
        ]


# ============================================================
# MEDICATION HISTORY SERIALIZER
# ============================================================

class MedicationHistorySerializer(
    serializers.ModelSerializer
):

    medicine_name = serializers.CharField(
        source="medicine.medicine_name",
        read_only=True
    )

    reminder_time = serializers.TimeField(
        source="reminder.reminder_time",
        read_only=True
    )

    class Meta:

        model = MedicationHistory

        fields = [
            "id",
            "user",
            "medicine",
            "medicine_name",
            "reminder",
            "reminder_time",
            "status",
            "taken_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "medicine_name",
            "reminder_time",
            "taken_at",
        ]