from rest_framework.routers import DefaultRouter

from .views import PrescriptionViewSet

router = DefaultRouter(trailing_slash=True)
router.register("prescriptions", PrescriptionViewSet, basename="prescription")

urlpatterns = router.urls
