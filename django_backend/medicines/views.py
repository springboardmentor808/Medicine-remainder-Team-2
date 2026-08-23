from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DiseaseCategory, Medicine, MedicineSchedule, DoseLog
from .serializers import DiseaseCategorySerializer, MedicineSerializer, format_time_12h


# =================================================================
# Disease Categories
# =================================================================
class DiseaseCategoryViewSet(viewsets.ModelViewSet):
    queryset = DiseaseCategory.objects.all()
    serializer_class = DiseaseCategorySerializer

    def create(self, request, *args, **kwargs):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Category name is required"}, status=400)
        if DiseaseCategory.objects.filter(name=name).exists():
            return Response({"error": "Category already exists"}, status=409)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Category added successfully", "category": serializer.data}, status=201
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"message": "Category updated successfully", "category": serializer.data})

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        # Medicines aren't deleted with their category — they just become
        # uncategorized, since a medicine's stock/dosage record is still
        # valid even if the disease grouping it belonged to goes away.
        affected = category.medicines.count()
        category.medicines.update(category=None)
        category.delete()

        message = "Category deleted successfully"
        if affected:
            message += f" ({affected} medicine(s) are now uncategorized)"
        return Response({"message": message})

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({"count": len(serializer.data), "categories": serializer.data})


# =================================================================
# Medicines — CRUD Medicines, Get Medicines
# =================================================================
class MedicineViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineSerializer

    def get_queryset(self):
        qs = (
            Medicine.objects.select_related("category")
            .prefetch_related("schedules", "schedules__logs")
            .all()
        )
        params = self.request.query_params

        search = params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        category_id = params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)

        sort_map = {
            "name": "name",
            "stock_asc": "stock_quantity",
            "stock_desc": "-stock_quantity",
            "expiry": "expiry_date",
        }
        qs = qs.order_by(sort_map.get(params.get("sort_by"), "name"))
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        if request.query_params.get("low_stock") == "true":
            data = [m for m in data if m["low_stock"]]
        if request.query_params.get("refill_soon") == "true":
            data = [m for m in data if m["refill_soon"]]

        total = len(data)

        page_param = request.query_params.get("page")
        if page_param:
            try:
                page = max(1, int(page_param))
                per_page = max(1, int(request.query_params.get("per_page", 20)))
            except ValueError:
                return Response({"error": "page and per_page must be integers"}, status=400)
            start = (page - 1) * per_page
            data = data[start:start + per_page]
            return Response({
                "count": len(data), "total": total, "page": page,
                "per_page": per_page, "medicines": data,
            })

        return Response({"count": total, "medicines": data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({"medicine": self.get_serializer(instance).data})

    def create(self, request, *args, **kwargs):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Medicine name is required"}, status=400)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Medicine added successfully", "medicine": serializer.data}, status=201
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"message": "Medicine updated successfully", "medicine": serializer.data})

    def destroy(self, request, *args, **kwargs):
        medicine = self.get_object()
        # Prescriptions referencing this medicine keep their record; the link is cleared.
        medicine.prescriptions.update(medicine=None)
        medicine.delete()
        return Response({"message": "Medicine deleted successfully"})

    @action(detail=True, methods=["post"])
    def stock(self, request, pk=None):
        """Manual stock adjustment: POST {"change": 10} or {"change": -5}."""
        medicine = self.get_object()
        try:
            change = int(request.data.get("change", 0))
        except (TypeError, ValueError):
            return Response({"error": "change must be an integer"}, status=400)

        new_quantity = medicine.stock_quantity + change
        if new_quantity < 0:
            return Response({"error": "Stock cannot go below zero"}, status=400)

        medicine.stock_quantity = new_quantity
        medicine.save()
        return Response({
            "message": "Stock updated",
            "medicine": MedicineSerializer(medicine).data,
        })


# =================================================================
# Dashboard: today's reminder schedule, grouped by time of day,
# with "Mark as Taken" / undo.
# =================================================================
class TodayScheduleView(APIView):
    """GET /api/schedule/today/ — every reminder slot across all medicines,
    grouped into Morning / Afternoon / Night, with today's
    taken/not-taken status. Powers the dashboard's reminder cards."""

    def get(self, request):
        today = timezone.localdate()
        schedules = (
            MedicineSchedule.objects.select_related("medicine")
            .prefetch_related("logs")
            .order_by("period", "reminder_time")
        )

        grouped = {"Morning": [], "Afternoon": [], "Night": []}
        for slot in schedules:
            taken = slot.logs.filter(log_date=today).exists()
            grouped.setdefault(slot.period, []).append({
                "schedule_id": slot.id,
                "medicine_id": slot.medicine_id,
                "medicine_name": slot.medicine.name,
                "dosage": " ".join(filter(None, [slot.medicine.dosage_amount, slot.medicine.dosage_unit])),
                "dosage_form": slot.medicine.dosage_form,
                "quantity_per_dose": slot.medicine.quantity_per_dose,
                "reminder_time": slot.reminder_time.strftime("%H:%M") if slot.reminder_time else None,
                "reminder_time_label": format_time_12h(slot.reminder_time),
                "taken_today": taken,
            })

        return Response({"date": str(today), "schedule": grouped})


class MarkDoseTakenView(APIView):
    """POST /api/schedule/<schedule_id>/take/ — mark today's dose taken and
    deduct quantity_per_dose from stock. Idempotent: tapping twice doesn't
    double-deduct."""

    def post(self, request, schedule_id):
        try:
            slot = MedicineSchedule.objects.select_related("medicine").get(pk=schedule_id)
        except MedicineSchedule.DoesNotExist:
            return Response({"error": "Reminder slot not found"}, status=404)

        today = timezone.localdate()
        log, created = DoseLog.objects.get_or_create(
            schedule=slot, log_date=today, defaults={"medicine": slot.medicine}
        )
        if created:
            medicine = slot.medicine
            medicine.stock_quantity = max(0, medicine.stock_quantity - round(medicine.quantity_per_dose or 1))
            medicine.save()

        return Response({"message": "Marked as taken", "taken_today": True})


class UndoDoseTakenView(APIView):
    """POST /api/schedule/<schedule_id>/undo/ — undo today's "taken" mark
    and restore the deducted stock."""

    def post(self, request, schedule_id):
        try:
            slot = MedicineSchedule.objects.select_related("medicine").get(pk=schedule_id)
        except MedicineSchedule.DoesNotExist:
            return Response({"error": "Reminder slot not found"}, status=404)

        today = timezone.localdate()
        deleted, _ = DoseLog.objects.filter(schedule=slot, log_date=today).delete()
        if deleted:
            medicine = slot.medicine
            medicine.stock_quantity += round(medicine.quantity_per_dose or 1)
            medicine.save()

        return Response({"message": "Marked as not taken", "taken_today": False})