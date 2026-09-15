from rest_framework import serializers

from .models import (
    Medicine,
    Condition,
    Prescription,
)


# ============================================================
# MEDICINE SERIALIZER
# ============================================================

class MedicineSerializer(serializers.ModelSerializer):

    # --------------------------------------------------------
    # CONDITION INFORMATION
    # --------------------------------------------------------

    condition_name = serializers.CharField(
        source="condition.condition_name",
        read_only=True,
    )

    class Meta:

        model = Medicine

        fields = [
            "id",
            "user",

            # Medicine information
            "medicine_name",
            "dosage",
            "quantity",
            "frequency",

            # Treatment dates
            "start_date",
            "end_date",

            # Reminder settings
            "reminder_time",
            "reminder_times",
            "reminder_enabled",

            # Disease / Condition
            "condition",
            "condition_name",

            # Medication Category
            "medication_category",

            # Timestamp
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "condition_name",
            "created_at",
        ]

    # --------------------------------------------------------
    # VALIDATE MEDICINE NAME
    # --------------------------------------------------------

    def validate_medicine_name(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Medicine name cannot be empty."
            )

        return value

    # --------------------------------------------------------
    # VALIDATE DOSAGE
    # --------------------------------------------------------

    def validate_dosage(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Dosage cannot be empty."
            )

        return value

    # --------------------------------------------------------
    # VALIDATE FREQUENCY
    # --------------------------------------------------------

    def validate_frequency(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Frequency cannot be empty."
            )

        return value

    # --------------------------------------------------------
    # VALIDATE QUANTITY
    # --------------------------------------------------------

    def validate_quantity(self, value):

        if value is None:
            raise serializers.ValidationError(
                "Quantity is required."
            )

        if value <= 0:

            raise serializers.ValidationError(
                "Quantity must be greater than 0."
            )

        return value

    # --------------------------------------------------------
    # VALIDATE CONDITION
    # --------------------------------------------------------

    def validate_condition(self, condition):

        if condition is None:

            return condition

        request = self.context.get(
            "request"
        )

        if (
            request
            and request.user.is_authenticated
        ):

            # ------------------------------------------------
            # Security:
            # Condition must belong to logged-in user.
            # ------------------------------------------------

            if condition.user != request.user:

                raise serializers.ValidationError(
                    "You can only assign your own condition "
                    "to a medicine."
                )

        return condition

    # --------------------------------------------------------
    # VALIDATE MEDICATION CATEGORY
    # --------------------------------------------------------

    def validate_medication_category(
        self,
        value
    ):

        valid_categories = {
            choice[0]
            for choice
            in Medicine.MEDICATION_CATEGORIES
        }

        if value not in valid_categories:

            raise serializers.ValidationError(
                "Invalid medication category."
            )

        return value


# ============================================================
# CONDITION SERIALIZER
# ============================================================

class ConditionSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Condition

        fields = [
            "id",
            "condition_name",
            "description",
            "diagnosed_date",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    # --------------------------------------------------------
    # VALIDATE CONDITION NAME
    # --------------------------------------------------------

    def validate_condition_name(
        self,
        value
    ):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Condition name cannot be empty."
            )

        return value

    # --------------------------------------------------------
    # VALIDATE DESCRIPTION
    # --------------------------------------------------------

    def validate_description(
        self,
        value
    ):

        if value is None:

            return ""

        return value.strip()


# ============================================================
# PRESCRIPTION SERIALIZER
# ============================================================

class PrescriptionSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Prescription

        fields = [
            "id",
            "user",
            "prescription_image",
            "prescription_date",
            "expiry_date",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
        ]

    # --------------------------------------------------------
    # VALIDATE PRESCRIPTION IMAGE
    # --------------------------------------------------------

    def validate_prescription_image(
        self,
        image
    ):

        if not image:

            raise serializers.ValidationError(
                "Prescription image is required."
            )

        allowed_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        }

        content_type = getattr(
            image,
            "content_type",
            None
        )

        if (
            content_type
            and content_type not in allowed_types
        ):

            raise serializers.ValidationError(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            )

        # 10 MB maximum
        max_size = (
            10 *
            1024 *
            1024
        )

        if image.size > max_size:

            raise serializers.ValidationError(
                "Prescription image must be less than 10 MB."
            )

        return image

    # --------------------------------------------------------
    # VALIDATE NOTES
    # --------------------------------------------------------

    def validate_notes(
        self,
        value
    ):

        if value is None:

            return ""

        return value.strip()

    # --------------------------------------------------------
    # VALIDATE PRESCRIPTION DATES
    # --------------------------------------------------------

    def validate(
        self,
        attrs
    ):

        prescription_date = attrs.get(
            "prescription_date"
        )

        expiry_date = attrs.get(
            "expiry_date"
        )

        # ----------------------------------------------------
        # Expiry cannot be before prescription date
        # ----------------------------------------------------

        if (
            prescription_date
            and expiry_date
            and expiry_date < prescription_date
        ):

            raise serializers.ValidationError(
                {
                    "expiry_date":
                    "Expiry date cannot be before "
                    "prescription date."
                }
            )

        return attrs