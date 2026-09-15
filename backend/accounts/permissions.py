from rest_framework.permissions import BasePermission


# ============================================================
# PATIENT PERMISSION
# ============================================================

class IsPatient(BasePermission):

    message = "Patient access required."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.role == "Patient"

        except Exception:
            return False


# ============================================================
# CAREGIVER PERMISSION
# ============================================================

class IsCaregiver(BasePermission):

    message = "Caregiver access required."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.role == "Caregiver"

        except Exception:
            return False


# ============================================================
# ADMIN PERMISSION
# ============================================================

class IsAdmin(BasePermission):

    message = "Admin access required."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.role == "Admin"

        except Exception:
            return False


# ============================================================
# ADMIN OR CAREGIVER
# ============================================================

class IsAdminOrCaregiver(BasePermission):

    message = "Admin or Caregiver access required."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        try:

            role = request.user.profile.role

            return role in [
                "Admin",
                "Caregiver"
            ]

        except Exception:
            return False


# ============================================================
# ANY VALID PILLSYNC ROLE
# ============================================================

class IsPillSyncUser(BasePermission):

    message = "Valid PillSync user role required."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        try:

            role = request.user.profile.role

            return role in [
                "Admin",
                "Patient",
                "Caregiver"
            ]

        except Exception:
            return False