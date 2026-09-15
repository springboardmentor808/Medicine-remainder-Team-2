@echo off

cd /d "C:\Users\SUBRAT\Desktop\PillSync\backend"

call "C:\Users\SUBRAT\Desktop\PillSync\backend\env\Scripts\activate.bat"

python manage.py check_reminders

pause