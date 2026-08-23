from django.utils import timezone
from rest_framework import serializers

from .models import DiseaseCategory, Medicine, MedicineSchedule


def format_time_12h(value):
    if not value:
        return None
    return value.strftime("%I:%M %p").lstrip("0")


class MedicineScheduleSerializer(serializers.ModelSerializer):
    """One reminder slot: just a time-of-day period + an optional exact time.
    No meal-relation/breakfast fields — kept intentionally simple."""

    reminder_time_label = serializers.SerializerMethodField()
    taken_today = serializers.SerializerMethodField()

    class Meta:
        model = MedicineSchedule
        fields = ["id", "period", "reminder_time", "reminder_time_label", "sort_order", "taken_today"]
        read_only_fields = ["id"]

    def get_reminder_time_label(self, obj):
        return format_time_12h(obj.reminder_time)

    def get_taken_today(self, obj):
        # obj may be an unsaved slot during create/update preview — guard for that
        if not obj.pk:
            return False
        today = timezone.localdate()
        return obj.logs.filter(log_date=today).exists()


class DiseaseCategorySerializer(serializers.ModelSerializer):
    medicine_count = serializers.SerializerMethodField()

    class Meta:
        model = DiseaseCategory
        fields = ["id", "name", "description", "medicine_count"]

    def get_medicine_count(self, obj):
        return obj.medicines.count()


class MedicineSerializer(serializers.ModelSerializer):
    # "schedule" is the JSON key clients send/receive; it maps to the
    # model's related_name "schedules" via source=.
    schedule = MedicineScheduleSerializer(many=True, source="schedules", required=False)

    category_name = serializers.CharField(source="category.name", read_only=True)
    dosage_frequency = serializers.SerializerMethodField()
    doses_per_day = serializers.ReadOnlyField()
    low_stock = serializers.ReadOnlyField()
    estimated_days_remaining = serializers.ReadOnlyField()
    refill_soon = serializers.ReadOnlyField()

    class Meta:
        model = Medicine
        fields = [
            "id", "name", "manufacturer",
            "dosage_amount", "dosage_unit", "dosage_form",
            "dosage_frequency", "quantity_per_dose", "schedule",
            "stock_quantity", "reorder_level", "low_stock",
            "estimated_days_remaining", "refill_soon", "doses_per_day",
            "unit_price", "expiry_date", "description",
            "category", "category_name", "created_at", "updated_at",
        ]
        extra_kwargs = {
            "category": {"required": False, "allow_null": True},
        }

    def get_dosage_frequency(self, obj):
        """Auto-generated readable summary from the schedule, e.g.
        'Morning at 7:30 AM • Night at 9:00 PM' — never typed by hand."""
        parts = []
        for slot in obj.schedules.all():
            label = slot.period
            if slot.reminder_time:
                label += f" at {format_time_12h(slot.reminder_time)}"
            parts.append(label)
        return " • ".join(parts) if parts else None

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("cannot be negative")
        return value

    def validate_reorder_level(self, value):
        if value < 0:
            raise serializers.ValidationError("cannot be negative")
        return value

    def validate_unit_price(self, value):
        if value < 0:
            raise serializers.ValidationError("cannot be negative")
        return value

    def validate_quantity_per_dose(self, value):
        if value < 0:
            raise serializers.ValidationError("cannot be negative")
        return value

    def create(self, validated_data):
        schedule_data = validated_data.pop("schedules", [])
        medicine = Medicine.objects.create(**validated_data)
        self._save_schedule(medicine, schedule_data)
        return medicine

    def update(self, instance, validated_data):
        # Only touch the schedule if the client actually sent one — this
        # lets PATCH requests update other fields without wiping reminders.
        schedule_data = validated_data.pop("schedules", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if schedule_data is not None:
            instance.schedules.all().delete()
            self._save_schedule(instance, schedule_data)
        return instance

    @staticmethod
    def _save_schedule(medicine, schedule_data):
        for i, slot in enumerate(schedule_data):
            MedicineSchedule.objects.create(
                medicine=medicine,
                period=slot["period"],
                reminder_time=slot.get("reminder_time"),
                sort_order=i,
            )
