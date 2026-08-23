from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DiseaseCategoryViewSet,
    MedicineViewSet,
    TodayScheduleView,
    MarkDoseTakenView,
    UndoDoseTakenView,
)

router = DefaultRouter(trailing_slash=True)
router.register("categories", DiseaseCategoryViewSet, basename="category")
router.register("medicines", MedicineViewSet, basename="medicine")

urlpatterns = router.urls + [
    path("schedule/today/", TodayScheduleView.as_view()),
    path("schedule/<int:schedule_id>/take/", MarkDoseTakenView.as_view()),
    path("schedule/<int:schedule_id>/undo/", UndoDoseTakenView.as_view()),
]
