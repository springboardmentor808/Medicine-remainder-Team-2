import uuid

from django.db import models

from medicines.models import Medicine


def prescription_upload_path(instance, filename):
    """Store under media/prescriptions/<uuid>.<ext> — never trust the
    original filename for the on-disk path (avoids collisions and
    path-traversal issues). The original name is kept in the DB for display."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return f"prescriptions/{uuid.uuid4().hex}.{ext}"


class Prescription(models.Model):
    """An uploaded prescription file with metadata."""

    patient_name = models.CharField(max_length=150)
    doctor_name = models.CharField(max_length=150, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Optional link to a medicine in the catalog
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prescriptions",
    )

    file = models.FileField(upload_to=prescription_upload_path)
    original_filename = models.CharField(max_length=255, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.patient_name} — {self.original_filename}"
