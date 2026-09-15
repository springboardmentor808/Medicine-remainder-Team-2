from django.urls import path

from .views import (
    RefillPredictionView,
    ManualStockUpdateView,
    RefillHistoryView,
    RefillAnalyticsView,
)


urlpatterns = [

    # ========================================================
    # REFILL PREDICTION
    # GET /api/refill/<medicine_id>/
    # ========================================================

    path(
        "<int:medicine_id>/",
        RefillPredictionView.as_view(),
        name="refill-prediction",
    ),

    # ========================================================
    # MANUAL STOCK UPDATE / REFILL
    # POST /api/refill/<medicine_id>/update-stock/
    # ========================================================

    path(
        "<int:medicine_id>/update-stock/",
        ManualStockUpdateView.as_view(),
        name="manual-stock-update",
    ),

    # ========================================================
    # REFILL HISTORY
    # GET /api/refill/history/
    # ========================================================

    path(
        "history/",
        RefillHistoryView.as_view(),
        name="refill-history",
    ),

    # ========================================================
    # REFILL ANALYTICS
    # GET /api/refill/analytics/
    # ========================================================

    path(
        "analytics/",
        RefillAnalyticsView.as_view(),
        name="refill-analytics",
    ),
]