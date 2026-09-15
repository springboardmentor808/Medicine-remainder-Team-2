from django.core.mail import send_mail
from django.conf import settings


def send_medicine_reminder_email(user, reminder):

    if not user.email:
        raise Exception(
            "The logged-in user does not have an email address."
        )

    medicine = reminder.medicine

    subject = "PillSync Medicine Reminder"

    message = f"""
Hello {user.username},

This is your PillSync medicine reminder.

Medicine: {medicine.medicine_name}
Dosage: {medicine.dosage}
Reminder Time: {reminder.reminder_time.strftime("%I:%M %p")}

Please take your medicine on time.

Thank you,
PillSync
"""

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return True