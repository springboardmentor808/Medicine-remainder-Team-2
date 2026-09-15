from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Profile,
    CaregiverPatientAssignment
)


# ============================================================
# REGISTER
# ============================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    role = serializers.ChoiceField(
        choices=[
            ("Patient", "Patient"),
            ("Caregiver", "Caregiver"),
        ],
        write_only=True,
        required=False,
        default="Patient"
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "role"
        ]

    # --------------------------------------------------------
    # USERNAME VALIDATION
    # --------------------------------------------------------

    def validate_username(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    # --------------------------------------------------------
    # EMAIL VALIDATION
    # --------------------------------------------------------

    def validate_email(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Email is required."
            )

        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    # --------------------------------------------------------
    # CREATE USER
    # --------------------------------------------------------

    def create(self, validated_data):

        role = validated_data.pop(
            "role",
            "Patient"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )

        # Create/update profile with selected role
        Profile.objects.update_or_create(
            user=user,
            defaults={
                "role": role
            }
        )

        return user


# ============================================================
# PROFILE
# ============================================================

class ProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = Profile

        fields = [
            "id",
            "user",
            "role",
            "phone",
            "date_of_birth",
            "address"
        ]

        read_only_fields = [
            "id",
            "user",
            "role"
        ]


# ============================================================
# CAREGIVER - PATIENT ASSIGNMENT
# ============================================================

class CaregiverPatientAssignmentSerializer(
    serializers.ModelSerializer
):

    caregiver_username = serializers.CharField(
        source="caregiver.username",
        read_only=True
    )

    patient_username = serializers.CharField(
        source="patient.username",
        read_only=True
    )

    class Meta:

        model = CaregiverPatientAssignment

        fields = [
            "id",
            "caregiver",
            "caregiver_username",
            "patient",
            "patient_username",
            "assigned_at"
        ]

        read_only_fields = [
            "id",
            "caregiver_username",
            "patient_username",
            "assigned_at"
        ]