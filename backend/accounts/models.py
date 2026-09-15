from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):

    ROLE_CHOICES = [
        ("Admin", "Admin"),
        ("Patient", "Patient"),
        ("Caregiver", "Caregiver"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="Patient"
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    def __str__(self):
        return self.user.username


class CaregiverPatientAssignment(models.Model):

    caregiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="caregiver_assignments"
    )

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="patient_assignments"
    )

    assigned_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = ("caregiver", "patient")

    def __str__(self):
        return (
            f"{self.caregiver.username} -> "
            f"{self.patient.username}"
        )