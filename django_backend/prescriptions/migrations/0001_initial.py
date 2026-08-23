import django.db.models.deletion
import prescriptions.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("medicines", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Prescription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("patient_name", models.CharField(max_length=150)),
                ("doctor_name", models.CharField(blank=True, max_length=150, null=True)),
                ("notes", models.TextField(blank=True, null=True)),
                ("file", models.FileField(upload_to=prescriptions.models.prescription_upload_path)),
                ("original_filename", models.CharField(blank=True, max_length=255)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "medicine",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="prescriptions",
                        to="medicines.medicine",
                    ),
                ),
            ],
            options={"ordering": ["-uploaded_at"]},
        ),
    ]
