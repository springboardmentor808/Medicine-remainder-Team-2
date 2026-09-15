from datetime import date

from django.core.management.base import BaseCommand
from django.utils import timezone

from reminders.models import Reminder
from reminders.email_service import send_medicine_reminder_email
from notifications.models import Notification
from refill.views import calculate_refill_prediction, create_refill_notification
from medicines.models import Medicine, Prescription


class Command(BaseCommand):

    help = "Check medicine reminders, refill status and prescription expiry notifications."

    PRESCRIPTION_WARNING_DAYS = 7

    def handle(self, *args, **options):

        now = timezone.localtime()

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "============================================"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "PillSync Automatic Notification Check"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Time: {now.strftime('%Y-%m-%d %I:%M:%S %p')}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "============================================"
            )
        )

        reminder_count = self.check_medicine_reminders(now)
        refill_count = self.check_refill_notifications()
        prescription_count = self.check_prescription_expiry()

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "============================================"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Automatic notification check completed."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Medicine reminders processed: {reminder_count}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Refill notifications created: {refill_count}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Prescription notifications created: {prescription_count}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "============================================"
            )
        )

    # ---------------------------------------------------------
    # MEDICINE REMINDERS
    # ---------------------------------------------------------

    def check_medicine_reminders(self, now):

        current_hour = now.hour
        current_minute = now.minute

        reminders = (
            Reminder.objects.filter(
                reminder_time__hour=current_hour,
                reminder_time__minute=current_minute,
                is_taken=False,
            )
            .exclude(
                status__in=[
                    "Taken",
                    "Missed",
                    "Snoozed",
                ]
            )
            .select_related(
                "user",
                "medicine",
            )
        )

        if not reminders.exists():

            self.stdout.write(
                self.style.WARNING(
                    f"No medicine reminders are due at "
                    f"{now.strftime('%I:%M %p')}."
                )
            )

            return 0

        processed_count = 0

        for reminder in reminders:

            try:

                medicine_name = reminder.medicine.medicine_name
                dosage = reminder.medicine.dosage

                # Check whether today's notification already exists
                notification_exists = Notification.objects.filter(
                    user=reminder.user,
                    notification_type="medicine",
                    is_read=False,
                    created_at__date=now.date(),
                    message__icontains=medicine_name,
                ).exists()

                if not notification_exists:

                    Notification.objects.create(
                        user=reminder.user,
                        notification_type="medicine",
                        title="Medicine Reminder",
                        message=(
                            f"It is time to take "
                            f"{medicine_name} ({dosage})."
                        ),
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"In-app notification created: "
                            f"{medicine_name}"
                        )
                    )

                else:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Medicine notification already exists: "
                            f"{medicine_name}"
                        )
                    )

                # Try email separately.
                # If email fails, the in-app notification still works.
                try:

                    send_medicine_reminder_email(
                        reminder.user,
                        reminder,
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Reminder email sent: "
                            f"{medicine_name} -> "
                            f"{reminder.user.email}"
                        )
                    )

                except Exception as email_error:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Email failed for Reminder ID "
                            f"{reminder.id}: {email_error}"
                        )
                    )

                reminder.status = "Notified"

                reminder.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

                processed_count += 1

            except Exception as error:

                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to process reminder ID "
                        f"{reminder.id}: {error}"
                    )
                )

        return processed_count

    # ---------------------------------------------------------
    # REFILL NOTIFICATIONS
    # ---------------------------------------------------------

    def check_refill_notifications(self):

        created_count = 0

        medicines = self.get_user_medicines()

        if not medicines.exists():

            self.stdout.write(
                self.style.WARNING(
                    "No medicines found for refill checking."
                )
            )

            return 0

        for medicine in medicines:

            try:

                prediction = calculate_refill_prediction(
                    medicine
                )

                # Only create notification when stock is low
                # or completely out.
                if not (
                    prediction.get("low_stock")
                    or prediction.get("out_of_stock")
                ):
                    continue

                # Prevent duplicate unread refill notifications.
                existing_notification = Notification.objects.filter(
                    user=medicine.user,
                    notification_type="refill",
                    is_read=False,
                    message__icontains=medicine.medicine_name,
                ).exists()

                if existing_notification:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Refill notification already exists: "
                            f"{medicine.medicine_name}"
                        )
                    )

                    continue

                notification = create_refill_notification(
                    medicine.user,
                    medicine,
                    prediction,
                )

                if notification:

                    created_count += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Refill notification created: "
                            f"{medicine.medicine_name} -> "
                            f"{prediction['stock_status']}"
                        )
                    )

            except Exception as error:

                self.stdout.write(
                    self.style.ERROR(
                        f"Refill check failed for "
                        f"{medicine.medicine_name}: {error}"
                    )
                )

        return created_count

    # ---------------------------------------------------------
    # ACTIVE USER MEDICINES
    # ---------------------------------------------------------

    def get_user_medicines(self):

        return (
            Medicine.objects
            .filter(
                user__is_active=True
            )
            .select_related("user")
        )

    # ---------------------------------------------------------
    # PRESCRIPTION EXPIRY
    # ---------------------------------------------------------

    def check_prescription_expiry(self):

        today = date.today()

        prescriptions = (
            Prescription.objects
            .filter(
                user__is_active=True
            )
            .select_related("user")
        )

        created_count = 0

        if not prescriptions.exists():

            self.stdout.write(
                self.style.WARNING(
                    "No prescriptions found for expiry checking."
                )
            )

            return 0

        for prescription in prescriptions:

            try:

                if not prescription.expiry_date:
                    continue

                expiry_date = prescription.expiry_date

                days_remaining = (
                    expiry_date - today
                ).days

                # More than 7 days remaining.
                # No notification needed.
                if days_remaining > self.PRESCRIPTION_WARNING_DAYS:
                    continue

                # Already expired
                if days_remaining < 0:

                    title = "Prescription Expired"

                    message = (
                        f"Your prescription #{prescription.id} "
                        f"expired on {expiry_date}. "
                        f"Please consult your healthcare provider "
                        f"if a new prescription is required."
                    )

                # Expires today
                elif days_remaining == 0:

                    title = "Prescription Expires Today"

                    message = (
                        f"Your prescription #{prescription.id} "
                        f"expires today ({expiry_date}). "
                        f"Please check whether a new prescription "
                        f"is required."
                    )

                # Expires within 7 days
                else:

                    title = "Prescription Expiring Soon"

                    message = (
                        f"Your prescription #{prescription.id} "
                        f"expires in {days_remaining} day(s) "
                        f"on {expiry_date}. "
                        f"Please check whether a new prescription "
                        f"is required."
                    )

                # Prevent duplicate unread notifications.
                notification_exists = Notification.objects.filter(
                    user=prescription.user,
                    notification_type="prescription",
                    is_read=False,
                    message__icontains=(
                        f"prescription #{prescription.id}"
                    ),
                ).exists()

                if notification_exists:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Prescription notification already "
                            f"exists: #{prescription.id}"
                        )
                    )

                    continue

                Notification.objects.create(
                    user=prescription.user,
                    notification_type="prescription",
                    title=title,
                    message=message,
                )

                created_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Prescription notification created: "
                        f"#{prescription.id} - {title}"
                    )
                )

            except Exception as error:

                self.stdout.write(
                    self.style.ERROR(
                        f"Prescription expiry check failed for "
                        f"prescription #{prescription.id}: {error}"
                    )
                )

        return created_count