from datetime import datetime
from medicines.models import Medicine


def check_medicine_reminders():
    """
    Check all enabled medicine reminders and display
    reminders whose scheduled time matches the current time.
    """

    current_time = datetime.now().strftime("%H:%M")

    medicines = Medicine.objects.filter(reminder_enabled=True)

    if not medicines.exists():
        print("\n========================================")
        print("        PillSync Reminder Service")
        print("========================================")
        print("No medicines available.")
        print("========================================\n")
        return

    reminder_found = False

    for medicine in medicines:

        reminder_time = medicine.reminder_time.strftime("%H:%M")

        if reminder_time == current_time:

            reminder_found = True

            print("\n========================================")
            print("         💊 PillSync Reminder")
            print("========================================")
            print(f"Medicine Name : {medicine.medicine_name}")
            print(f"Dosage        : {medicine.dosage}")
            print(f"Quantity      : {medicine.quantity}")
            print(f"Frequency     : {medicine.frequency}")
            print(f"Reminder Time : {medicine.reminder_time}")
            print("Status        : Time to take medicine")
            print("========================================\n")

    if not reminder_found:
        print("\n========================================")
        print("        PillSync Reminder Service")
        print("========================================")
        print(f"Current Time : {current_time}")
        print("No reminders scheduled at this time.")
        print("========================================\n")exi