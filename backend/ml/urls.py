from django.urls import path
from .views import AdherencePredictionView

urlpatterns = [
    path("predict/", AdherencePredictionView.as_view(), name="predict-adherence"),
]