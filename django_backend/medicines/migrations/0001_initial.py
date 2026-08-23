import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DiseaseCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("description", models.TextField(blank=True, null=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Medicine",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("manufacturer", models.CharField(blank=True, max_length=150, null=True)),
                ("dosage_amount", models.CharField(blank=True, max_length=50, null=True)),
                ("dosage_unit", models.CharField(blank=True, max_length=20, null=True)),
                ("dosage_form", models.CharField(blank=True, max_length=50, null=True)),
                ("quantity_per_dose", models.FloatField(default=1)),
                ("stock_quantity", models.IntegerField(default=0)),
                ("reorder_level", models.IntegerField(default=10)),
                ("unit_price", models.FloatField(default=0.0)),
                ("expiry_date", models.DateField(blank=True, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="medicines",
                        to="medicines.diseasecategory",
                    ),
                ),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="MedicineSchedule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "period",
                    models.CharField(
                        choices=[
                            ("Morning", "Morning"),
                            ("Afternoon", "Afternoon"),
                            ("Night", "Night"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reminder_time", models.TimeField(blank=True, null=True)),
                ("sort_order", models.IntegerField(default=0)),
                (
                    "medicine",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="schedules",
                        to="medicines.medicine",
                    ),
                ),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="DoseLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("log_date", models.DateField()),
                ("taken_at", models.DateTimeField(auto_now_add=True)),
                (
                    "medicine",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dose_logs",
                        to="medicines.medicine",
                    ),
                ),
                (
                    "schedule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="logs",
                        to="medicines.medicineschedule",
                    ),
                ),
            ],
            options={"ordering": ["-taken_at"]},
        ),
        migrations.AlterUniqueTogether(
            name="doselog",
            unique_together={("schedule", "log_date")},
        ),
    ]