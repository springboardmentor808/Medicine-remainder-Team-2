from django.db import models


class DiseaseCategory(models.Model):
    """Disease / condition categories, e.g. Diabetes, Blood Pressure."""

    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Medicine(models.Model):
    """A medicine in stock, with dosage info and a disease category."""

    name = models.CharField(max_length=150)
    manufacturer = models.CharField(max_length=150, blank=True, null=True)

    # Dosage information
    dosage_amount = models.CharField(max_length=50, blank=True, null=True)  # e.g. "500"
    dosage_unit = models.CharField(max_length=20, blank=True, null=True)    # e.g. "mg"
    dosage_form = models.CharField(max_length=50, blank=True, null=True)    # e.g. "Tablet"
    # how many units are taken each time a reminder fires, e.g. 1 tablet, 2 tablets
    quantity_per_dose = models.FloatField(default=1)

    # Stock management
    stock_quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    unit_price = models.FloatField(default=0.0)

    expiry_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    category = models.ForeignKey(
        DiseaseCategory,
        on_delete=models.SET_NULL,   # deleting a category uncategorizes medicines, doesn't delete them
        null=True,
        blank=True,
        related_name="medicines",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    # ---- Derived / computed fields (never stored, always fresh) ----

    @property
    def doses_per_day(self):
        """How many times a day this is taken — the number of reminder slots."""
        count = self.schedules.count()
        return count or None

    @property
    def low_stock(self):
        return self.stock_quantity <= self.reorder_level

    @property
    def estimated_days_remaining(self):
        """e.g. 60 tablets at 2/day -> 30 days remaining (matches the project spec's example)."""
        dpd = self.doses_per_day
        if not dpd:
            return None
        daily_consumption = dpd * (self.quantity_per_dose or 1)
        if daily_consumption <= 0:
            return None
        return int(self.stock_quantity // daily_consumption)

    @property
    def refill_soon(self):
        days = self.estimated_days_remaining
        return days is not None and days <= 7


class MedicineSchedule(models.Model):
    """One reminder slot for a medicine, e.g. 'Morning, 7:30 AM'.

    Scoped per medicine (single-patient use) for now. If/when user accounts
    (Patient/Caregiver/Admin, per the project's auth module) are added, this
    model would gain a `user` FK so each patient keeps their own reminder
    times against a shared medicine catalog entry.
    """

    PERIOD_CHOICES = [
        ("Morning", "Morning"),
        ("Afternoon", "Afternoon"),
        ("Night", "Night"),
    ]

    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="schedules")
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    reminder_time = models.TimeField(blank=True, null=True)  # optional exact clock time
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.medicine.name} — {self.period}"


class DoseLog(models.Model):
    """One 'I took this dose' record per schedule slot per calendar day.

    The unique_together makes marking taken idempotent, and 'undo' just
    deletes today's row.
    """

    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="dose_logs")
    schedule = models.ForeignKey(MedicineSchedule, on_delete=models.CASCADE, related_name="logs")
    log_date = models.DateField()
    taken_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("schedule", "log_date")
        ordering = ["-taken_at"]