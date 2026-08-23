"""Populate the database with sample categories, medicines, and reminder
schedules.

    python manage.py seed

Categories and the "60 tablets / 2 per day" example are taken directly from
the PillSync project spec (section 7: Disease-Based Medication Organization,
section 6: AI Refill Prediction Engine example).
"""
from django.core.management.base import BaseCommand

from medicines.models import DiseaseCategory, Medicine, MedicineSchedule


class Command(BaseCommand):
    help = "Seed sample disease categories, medicines, and reminder schedules"

    def handle(self, *args, **options):
        if DiseaseCategory.objects.exists():
            self.stdout.write(self.style.WARNING(
                "Database already has data. Skipping seed. "
                "Delete db.sqlite3 and re-run migrate to reseed."
            ))
            return

        categories = {
            name: DiseaseCategory.objects.create(name=name, description=desc)
            for name, desc in [
                ("Blood Pressure", "Hypertension and blood pressure management"),
                ("Diabetes", "Blood sugar management"),
                ("Thyroid", "Thyroid hormone regulation"),
                ("Antibiotics", "Bacterial infections"),
                ("Vitamins", "Nutritional supplements"),
                ("Heart Medications", "Cardiac and cardiovascular conditions"),
            ]
        }

        # (name, manufacturer, dosage_amount, dosage_unit, dosage_form,
        #  quantity_per_dose, stock_quantity, reorder_level, unit_price,
        #  expiry_date, category, schedule[(period, "HH:MM"), ...])
        medicines = [
            # Exact worked example from the spec: 60 tablets at 2/day -> 30 days
            ("Amlodipine (BP)", "Cipla", "5", "mg", "Tablet", 1,
             60, 20, 0.20, "2026-12-31", categories["Blood Pressure"],
             [("Morning", "07:30"), ("Night", "21:00")]),
            ("Metformin", "Sun Pharma", "500", "mg", "Tablet", 1,
             120, 30, 0.15, "2027-06-30", categories["Diabetes"],
             [("Morning", "08:30"), ("Night", "21:30")]),
            ("Levothyroxine", "Abbott", "50", "mcg", "Tablet", 1,
             45, 15, 0.25, "2027-02-28", categories["Thyroid"],
             [("Morning", "06:30")]),
            ("Amoxicillin", "GSK", "250", "mg", "Capsule", 1,
             8, 20, 0.35, "2026-10-15", categories["Antibiotics"],
             [("Morning", "08:00"), ("Afternoon", "14:00"), ("Night", "20:00")]),
            ("Vitamin D3", "HealthKart", "1000", "IU", "Capsule", 1,
             200, 40, 0.08, "2027-08-01", categories["Vitamins"],
             [("Morning", "09:00")]),
            ("Atorvastatin", "Pfizer", "10", "mg", "Tablet", 1,
             14, 20, 0.30, "2026-11-30", categories["Heart Medications"],
             [("Night", "22:00")]),
        ]

        for (name, manufacturer, dosage_amount, dosage_unit, dosage_form,
             quantity_per_dose, stock_quantity, reorder_level, unit_price,
             expiry_date, category, schedule) in medicines:

            medicine = Medicine.objects.create(
                name=name, manufacturer=manufacturer,
                dosage_amount=dosage_amount, dosage_unit=dosage_unit, dosage_form=dosage_form,
                quantity_per_dose=quantity_per_dose,
                stock_quantity=stock_quantity, reorder_level=reorder_level, unit_price=unit_price,
                expiry_date=expiry_date, category=category,
            )
            for i, (period, reminder_time) in enumerate(schedule):
                MedicineSchedule.objects.create(
                    medicine=medicine, period=period, reminder_time=reminder_time, sort_order=i
                )

        self.stdout.write(self.style.SUCCESS(
            f"Seed data created: {len(categories)} categories, {len(medicines)} medicines with reminder schedules."
        ))
