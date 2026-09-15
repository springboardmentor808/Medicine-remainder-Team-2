from django.core.management.base import BaseCommand
from django.utils import timezone

from reminders.models import Reminder
from reminders.email_service import send_medicine_reminder_email


class Command(BaseCommand):

    help = "Check due medicine reminders and send automatic email notifications."

    def handle(self, *args, **options):

        now = timezone.localtime()

        current_hour = now.hour
        current_minute = now.minute

        reminders = Reminder.objects.filter(
            reminder_time__hour=current_hour,
            reminder_time__minute=current_minute,
            is_taken=False,
        ).exclude(
            status__in=["Taken", "Missed", "Snoozed"]
        ).select_related(
            "user",
            "medicine"
        )

        if not reminders.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"No reminders are due at "
                    f"{now.strftime('%I:%M %p')}."
                )
            )
            return

        sent_count = 0

        for reminder in reminders:

            try:

                send_medicine_reminder_email(
                    reminder.user,
                    reminder
                )

                reminder.status = "Notified"

                reminder.save(
                    update_fields=[
                        "status",
                        "updated_at"
                    ]
                )

                sent_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Reminder sent: "
                        f"{reminder.medicine.medicine_name} "
                        f"-> {reminder.user.email}"
                    )
                )

            except Exception as error:

                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to send reminder "
                        f"ID {reminder.id}: {error}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Reminder check completed. "
                f"Emails sent: {sent_count}"
            )
        )