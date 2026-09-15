from django.db import models
from django.contrib.auth.models import User
from medicines.models import Medicine


class RefillRecord(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="refill_records"
    )

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="refill_records"
    )

    # Quantity added during refill
    quantity_added = models.PositiveIntegerField(
        default=0
    )

    # Stock available before refill
    stock_before = models.PositiveIntegerField(
        default=0
    )

    # Stock available after refill
    stock_after = models.PositiveIntegerField(
        default=0
    )

    # Date and time when refill was performed
    refill_date = models.DateTimeField(
        auto_now_add=True
    )

    # Optional notes
    notes = models.TextField(
        blank=True,
        null=True
    )

    class Meta:
        ordering = ["-refill_date"]

    def __str__(self):
        return (
            f"{self.medicine.medicine_name} - "
            f"{self.quantity_added} units"
        )