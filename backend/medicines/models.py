from django.db import models
from django.contrib.auth.models import User


# ============================================================
# MEDICINE
# ============================================================

class Medicine(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="medicines"
    )

    medicine_name = models.CharField(
        max_length=100
    )

    dosage = models.CharField(
        max_length=50
    )

    quantity = models.PositiveIntegerField()

    frequency = models.CharField(
        max_length=50
    )

    start_date = models.DateField()

    end_date = models.DateField()

    # ========================================================
    # MAIN / DEFAULT REMINDER TIME
    # ========================================================

    reminder_time = models.TimeField(
        default="09:00"
    )

    # ========================================================
    # MULTIPLE REMINDER TIMES
    # ========================================================

    reminder_times = models.JSONField(
        default=list,
        blank=True
    )

    reminder_enabled = models.BooleanField(
        default=True
    )

    # ========================================================
    # DISEASE / CONDITION
    # ========================================================

    condition = models.ForeignKey(
        "Condition",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medicines"
    )

    # ========================================================
    # MEDICATION CATEGORY
    # ========================================================

    MEDICATION_CATEGORIES = [

        # ----------------------------------------------------
        # Common Medication Categories
        # ----------------------------------------------------

        (
            "antibiotic",
            "Antibiotic"
        ),

        (
            "vitamin",
            "Vitamin / Supplement"
        ),

        (
            "pain_relief",
            "Pain Relief"
        ),

        # ----------------------------------------------------
        # Heart / Blood Pressure
        # ----------------------------------------------------

        (
            "heart",
            "Heart Medication"
        ),

        (
            "blood_pressure",
            "Blood Pressure Medication"
        ),

        (
            "cholesterol",
            "Cholesterol Medication"
        ),

        # ----------------------------------------------------
        # Diabetes / Thyroid
        # ----------------------------------------------------

        (
            "diabetes",
            "Diabetes Medication"
        ),

        (
            "thyroid",
            "Thyroid Medication"
        ),

        # ----------------------------------------------------
        # Digestive
        # ----------------------------------------------------

        (
            "digestive",
            "Antacid / Digestive"
        ),

        # ----------------------------------------------------
        # Allergy / Respiratory
        # ----------------------------------------------------

        (
            "allergy",
            "Allergy Medication"
        ),

        (
            "respiratory",
            "Respiratory Medication"
        ),

        # ----------------------------------------------------
        # Anti-inflammatory / Infection
        # ----------------------------------------------------

        (
            "anti_inflammatory",
            "Anti-inflammatory"
        ),

        (
            "antifungal",
            "Antifungal"
        ),

        (
            "antiviral",
            "Antiviral"
        ),

        # ----------------------------------------------------
        # Neurological / Mental Health
        # ----------------------------------------------------

        (
            "neurological",
            "Neurological Medication"
        ),

        (
            "mental_health",
            "Mental Health Medication"
        ),

        # ----------------------------------------------------
        # Skin / Eye
        # ----------------------------------------------------

        (
            "skin",
            "Skin Medication"
        ),

        (
            "eye",
            "Eye Medication"
        ),

        # ----------------------------------------------------
        # Other
        # ----------------------------------------------------

        (
            "other",
            "Other"
        ),
    ]

    medication_category = models.CharField(
        max_length=30,
        choices=MEDICATION_CATEGORIES,
        default="other"
    )

    # ========================================================
    # CREATED DATE
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return self.medicine_name


# ============================================================
# PATIENT HEALTH CONDITION
# ============================================================

class Condition(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="conditions"
    )

    condition_name = models.CharField(
        max_length=100
    )

    description = models.TextField(
        blank=True
    )

    diagnosed_date = models.DateField(
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = [
            "-created_at"
        ]

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.condition_name}"
        )


# ============================================================
# PRESCRIPTION
# ============================================================

class Prescription(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prescriptions"
    )

    prescription_image = models.ImageField(
        upload_to="prescriptions/"
    )

    prescription_date = models.DateField(
        null=True,
        blank=True
    )

    expiry_date = models.DateField(
        null=True,
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.user.username} - "
            f"Prescription {self.id}"
        )