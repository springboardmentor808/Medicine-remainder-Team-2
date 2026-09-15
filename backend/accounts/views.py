from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    CaregiverPatientAssignmentSerializer
)

from .models import (
    Profile,
    CaregiverPatientAssignment
)

from .permissions import IsAdmin

# ============================================================
# MEDICINE / CONDITION / REMINDER IMPORTS
# ============================================================

from medicines.models import (
    Medicine,
    Condition
)

from reminders.models import (
    Reminder,
    MedicationHistory
)


# ============================================================
# USER REGISTRATION
# ============================================================

class RegisterAPIView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            profile, created = Profile.objects.get_or_create(
                user=user,
                defaults={
                    "role": "Patient"
                }
            )

            return Response(
                {
                    "message": "Registration Successful",
                    "user_id": user.id,
                    "username": user.username,
                    "role": profile.role
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================
# USER LOGIN - JWT
# ============================================================

class LoginAPIView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        username = request.data.get(
            "username"
        )

        password = request.data.get(
            "password"
        )

        if not username or not password:

            return Response(
                {
                    "error":
                        "Username and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            username=username
        ).first()

        if user and user.check_password(password):

            profile, created = Profile.objects.get_or_create(
                user=user,
                defaults={
                    "role": "Patient"
                }
            )

            refresh = RefreshToken.for_user(
                user
            )

            return Response(
                {
                    "message": "Login Successful",
                    "username": user.username,
                    "user_id": user.id,
                    "role": profile.role,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "error":
                    "Invalid Username or Password"
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


# ============================================================
# USER PROFILE
# ============================================================

class ProfileView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        user = request.user

        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                "role": "Patient"
            }
        )

        return Response(
            {
                "username": user.username,
                "email": user.email,
                "role": profile.role,
                "phone": profile.phone,
                "date_of_birth": profile.date_of_birth,
                "address": profile.address
            },
            status=status.HTTP_200_OK
        )

    def put(self, request):

        user = request.user

        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                "role": "Patient"
            }
        )

        # ----------------------------------------------------
        # UPDATE EMAIL
        # ----------------------------------------------------

        if "email" in request.data:

            email = request.data.get(
                "email"
            )

            if email:

                existing_user = User.objects.filter(
                    email=email
                ).exclude(
                    id=user.id
                ).first()

                if existing_user:

                    return Response(
                        {
                            "error":
                                "Email is already in use."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                user.email = email

        # ----------------------------------------------------
        # UPDATE PHONE
        # ----------------------------------------------------

        if "phone" in request.data:

            profile.phone = request.data.get(
                "phone"
            )

        # ----------------------------------------------------
        # UPDATE DATE OF BIRTH
        # ----------------------------------------------------

        if "date_of_birth" in request.data:

            profile.date_of_birth = request.data.get(
                "date_of_birth"
            )

        # ----------------------------------------------------
        # UPDATE ADDRESS
        # ----------------------------------------------------

        if "address" in request.data:

            profile.address = request.data.get(
                "address"
            )

        user.save()
        profile.save()

        return Response(
            {
                "message":
                    "Profile Updated Successfully",
                "username":
                    user.username,
                "email":
                    user.email,
                "role":
                    profile.role,
                "phone":
                    profile.phone,
                "date_of_birth":
                    profile.date_of_birth,
                "address":
                    profile.address
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        current_password = request.data.get(
            "current_password"
        )

        new_password = request.data.get(
            "new_password"
        )

        if not current_password or not new_password:

            return Response(
                {
                    "error":
                        "Current password and new password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.check_password(
            current_password
        ):

            return Response(
                {
                    "error":
                        "Current password is incorrect."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:

            return Response(
                {
                    "error":
                        "New password must contain at least 8 characters."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_password == new_password:

            return Response(
                {
                    "error":
                        "New password must be different from the current password."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(
            new_password
        )

        request.user.save()

        return Response(
            {
                "message":
                    "Password changed successfully."
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# FORGOT PASSWORD
# ============================================================

class ForgotPasswordAPIView(APIView):

    authentication_classes = []

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        email = request.data.get(
            "email"
        )

        if not email:

            return Response(
                {
                    "error":
                        "Email is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            email=email
        ).first()

        if not user:

            return Response(
                {
                    "error":
                        "Email not registered."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        token_generator = PasswordResetTokenGenerator()

        token = token_generator.make_token(
            user
        )

        return Response(
            {
                "message":
                    "Password reset token generated successfully.",
                "user_id":
                    user.id,
                "token":
                    token
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordAPIView(APIView):

    authentication_classes = []

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        user_id = request.data.get(
            "user_id"
        )

        token = request.data.get(
            "token"
        )

        password = request.data.get(
            "password"
        )

        if not user_id or not token or not password:

            return Response(
                {
                    "error":
                        "User ID, token and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:

            return Response(
                {
                    "error":
                        "Password must contain at least 8 characters."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            id=user_id
        ).first()

        if not user:

            return Response(
                {
                    "error":
                        "Invalid password reset request."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        token_generator = PasswordResetTokenGenerator()

        if not token_generator.check_token(
            user,
            token
        ):

            return Response(
                {
                    "error":
                        "Invalid or expired password reset token."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(
            password
        )

        user.save()

        return Response(
            {
                "message":
                    "Password reset successfully."
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# LOGOUT
# ============================================================

class LogoutAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        refresh_token = request.data.get(
            "refresh"
        )

        if not refresh_token:

            return Response(
                {
                    "error":
                        "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            token = RefreshToken(
                refresh_token
            )

            token.blacklist()

            return Response(
                {
                    "message":
                        "Logout successful."
                },
                status=status.HTTP_200_OK
            )

        except Exception:

            return Response(
                {
                    "error":
                        "Invalid or expired refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================
# ADMIN TEST / ROLE PROTECTION
# ============================================================

class AdminTestAPIView(APIView):

    permission_classes = [
        IsAdmin
    ]

    def get(self, request):

        profile, created = Profile.objects.get_or_create(
            user=request.user,
            defaults={
                "role": "Patient"
            }
        )

        return Response(
            {
                "message":
                    "Admin Access Granted",
                "username":
                    request.user.username,
                "role":
                    profile.role
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# CAREGIVER - PATIENT ASSIGNMENT
# ADMIN ONLY
# ============================================================

class CaregiverPatientAssignmentAPIView(APIView):

    permission_classes = [
        IsAdmin
    ]

    # --------------------------------------------------------
    # GET ALL ASSIGNMENTS
    # --------------------------------------------------------

    def get(self, request):

        assignments = (
            CaregiverPatientAssignment.objects
            .select_related(
                "caregiver",
                "patient"
            )
            .all()
        )

        serializer = CaregiverPatientAssignmentSerializer(
            assignments,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------------------------------
    # CREATE ASSIGNMENT
    # --------------------------------------------------------

    def post(self, request):

        caregiver_id = request.data.get(
            "caregiver_id"
        )

        patient_id = request.data.get(
            "patient_id"
        )

        if not caregiver_id or not patient_id:

            return Response(
                {
                    "error":
                        "caregiver_id and patient_id are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        caregiver = User.objects.filter(
            id=caregiver_id
        ).first()

        patient = User.objects.filter(
            id=patient_id
        ).first()

        if not caregiver:

            return Response(
                {
                    "error":
                        "Caregiver not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not patient:

            return Response(
                {
                    "error":
                        "Patient not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        caregiver_profile = Profile.objects.filter(
            user=caregiver
        ).first()

        patient_profile = Profile.objects.filter(
            user=patient
        ).first()

        if (
            not caregiver_profile
            or caregiver_profile.role != "Caregiver"
        ):

            return Response(
                {
                    "error":
                        "Selected user is not a Caregiver."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            not patient_profile
            or patient_profile.role != "Patient"
        ):

            return Response(
                {
                    "error":
                        "Selected user is not a Patient."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if caregiver.id == patient.id:

            return Response(
                {
                    "error":
                        "A user cannot be assigned to themselves."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        assignment, created = (
            CaregiverPatientAssignment.objects.get_or_create(
                caregiver=caregiver,
                patient=patient
            )
        )

        serializer = CaregiverPatientAssignmentSerializer(
            assignment
        )

        if not created:

            return Response(
                {
                    "message":
                        "This caregiver is already assigned to this patient.",
                    "assignment":
                        serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message":
                    "Caregiver assigned to patient successfully.",
                "assignment":
                    serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# ============================================================
# CAREGIVER - VIEW MULTIPLE ASSIGNED PATIENT PROFILES
# ============================================================

class CaregiverAssignedPatientsAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        # ----------------------------------------------------
        # CHECK CAREGIVER ROLE
        # ----------------------------------------------------

        profile = Profile.objects.filter(
            user=request.user
        ).first()

        if not profile or profile.role != "Caregiver":

            return Response(
                {
                    "error":
                        "Caregiver access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # GET ALL ASSIGNED PATIENTS
        # ----------------------------------------------------

        assignments = (
            CaregiverPatientAssignment.objects
            .select_related(
                "patient"
            )
            .filter(
                caregiver=request.user
            )
            .order_by(
                "-assigned_at"
            )
        )

        patients = []

        for assignment in assignments:

            patient = assignment.patient

            patient_profile = Profile.objects.filter(
                user=patient
            ).first()

            patients.append(
                {
                    "assignment_id":
                        assignment.id,

                    "patient_id":
                        patient.id,

                    "patient_username":
                        patient.username,

                    "patient_email":
                        patient.email,

                    "patient_role":
                        (
                            patient_profile.role
                            if patient_profile
                            else "Patient"
                        ),

                    "patient_phone":
                        (
                            patient_profile.phone
                            if patient_profile
                            else ""
                        ),

                    "patient_date_of_birth":
                        (
                            patient_profile.date_of_birth
                            if patient_profile
                            else None
                        ),

                    "patient_address":
                        (
                            patient_profile.address
                            if patient_profile
                            else ""
                        ),

                    "assigned_at":
                        assignment.assigned_at
                }
            )

        return Response(
            {
                "caregiver":
                    request.user.username,

                "total_patients":
                    len(patients),

                "patients":
                    patients
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# CAREGIVER - VIEW ONE ASSIGNED PATIENT DETAILS
# ============================================================

class CaregiverPatientDetailsAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, patient_id):

        # ----------------------------------------------------
        # CHECK CAREGIVER ROLE
        # ----------------------------------------------------

        profile = Profile.objects.filter(
            user=request.user
        ).first()

        if not profile or profile.role != "Caregiver":

            return Response(
                {
                    "error":
                        "Caregiver access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # CHECK PATIENT ASSIGNMENT
        # ----------------------------------------------------

        assignment = (
            CaregiverPatientAssignment.objects
            .select_related(
                "patient"
            )
            .filter(
                caregiver=request.user,
                patient_id=patient_id
            )
            .first()
        )

        if not assignment:

            return Response(
                {
                    "error":
                        "You are not assigned to this patient."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # PATIENT
        # ----------------------------------------------------

        patient = assignment.patient

        patient_profile = Profile.objects.filter(
            user=patient
        ).first()

        # ----------------------------------------------------
        # MEDICINES
        # ----------------------------------------------------

        medicines = (
            Medicine.objects
            .filter(
                user=patient
            )
            .order_by(
                "-id"
            )
        )

        medicine_data = []

        for medicine in medicines:

            medicine_data.append(
                {
                    "id":
                        medicine.id,

                    "name":
                        medicine.name,

                    "dosage":
                        medicine.dosage,

                    "quantity":
                        medicine.quantity,

                    "frequency":
                        medicine.frequency,
                }
            )

        # ----------------------------------------------------
        # CONDITIONS
        # ----------------------------------------------------

        conditions = (
            Condition.objects
            .filter(
                user=patient
            )
            .order_by(
                "-id"
            )
        )

        condition_data = []

        for condition in conditions:

            condition_data.append(
                {
                    "id":
                        condition.id,

                    "condition_name":
                        condition.condition_name,

                    "description":
                        condition.description,

                    "diagnosed_date":
                        condition.diagnosed_date,

                    "is_active":
                        condition.is_active,
                }
            )

        # ----------------------------------------------------
        # REMINDERS
        # ----------------------------------------------------

        reminders = (
            Reminder.objects
            .filter(
                user=patient
            )
            .select_related(
                "medicine"
            )
            .order_by(
                "reminder_time"
            )
        )

        reminder_data = []

        for reminder in reminders:

            reminder_data.append(
                {
                    "id":
                        reminder.id,

                    "medicine_name":
                        reminder.medicine.name,

                    "reminder_time":
                        reminder.reminder_time,

                    "status":
                        reminder.status,

                    "is_taken":
                        reminder.is_taken,
                }
            )

        # ----------------------------------------------------
        # MEDICATION HISTORY
        # ----------------------------------------------------

        history = (
            MedicationHistory.objects
            .filter(
                user=patient
            )
            .select_related(
                "medicine",
                "reminder"
            )
            .order_by(
                "-taken_at"
            )
        )

        history_data = []

        for record in history:

            history_data.append(
                {
                    "id":
                        record.id,

                    "medicine_name":
                        record.medicine.name,

                    "status":
                        record.status,

                    "taken_at":
                        record.taken_at,

                    "reminder_time":
                        (
                            record.reminder.reminder_time
                            if record.reminder
                            else None
                        ),
                }
            )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "patient": {
                    "id":
                        patient.id,

                    "username":
                        patient.username,

                    "email":
                        patient.email,

                    "role":
                        (
                            patient_profile.role
                            if patient_profile
                            else "Patient"
                        ),

                    "phone":
                        (
                            patient_profile.phone
                            if patient_profile
                            else ""
                        ),

                    "date_of_birth":
                        (
                            patient_profile.date_of_birth
                            if patient_profile
                            else None
                        ),

                    "address":
                        (
                            patient_profile.address
                            if patient_profile
                            else ""
                        ),

                    "assigned_at":
                        assignment.assigned_at
                },

                "summary": {
                    "total_medicines":
                        len(medicine_data),

                    "total_conditions":
                        len(condition_data),

                    "total_reminders":
                        len(reminder_data),

                    "total_history":
                        len(history_data),
                },

                "medicines":
                    medicine_data,

                "conditions":
                    condition_data,

                "reminders":
                    reminder_data,

                "history":
                    history_data,
            },
            status=status.HTTP_200_OK
        )