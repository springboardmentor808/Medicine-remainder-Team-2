from django.contrib import admin

from .models import DiseaseCategory, Medicine, MedicineSchedule, DoseLog


class MedicineScheduleInline(admin.TabularInline):
    model = MedicineSchedule
    extra = 1


@admin.register(DiseaseCategory)
class DiseaseCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "stock_quantity", "reorder_level", "expiry_date")
    list_filter = ("category",)
    search_fields = ("name", "manufacturer")
    inlines = [MedicineScheduleInline]


@admin.register(DoseLog)
class DoseLogAdmin(admin.ModelAdmin):
    list_display = ("medicine", "schedule", "log_date", "taken_at")
    list_filter = ("log_date",)
