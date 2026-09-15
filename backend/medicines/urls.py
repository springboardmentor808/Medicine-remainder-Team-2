from django.urls import path

from .views import (
    MedicineListCreateView,
    MedicineDetailView,
    MedicineOCRView,
    MedicineImagePredictionView,
    PrescriptionAIOCRView,

    # Health Conditions
    ConditionListCreateView,
    ConditionOptionsView,
    ConditionDetailView,

    # Prescriptions
    PrescriptionListCreateView,
    PrescriptionDetailView,
    PrescriptionExpiryNotificationView,
)


urlpatterns = [

    # ========================================================
    # MEDICINE LIST + CREATE
    # ========================================================

    path(
        "",
        MedicineListCreateView.as_view(),
        name="medicine-list"
    ),


    # ========================================================
    # PRINTED MEDICINE / PRESCRIPTION OCR
    # ========================================================

    path(
        "ocr/",
        MedicineOCRView.as_view(),
        name="medicine-ocr"
    ),


    # ========================================================
    # AI MEDICINE IMAGE RECOGNITION
    # ========================================================

    path(
        "medicine-image-predict/",
        MedicineImagePredictionView.as_view(),
        name="medicine-image-predict"
    ),


    # ========================================================
    # HANDWRITTEN DOCTOR PRESCRIPTION AI OCR
    # ========================================================

    path(
        "prescription-ai/",
        PrescriptionAIOCRView.as_view(),
        name="prescription-ai-ocr"
    ),


    # ========================================================
    # PRESCRIPTION MANAGEMENT
    # ========================================================

    path(
        "prescriptions/",
        PrescriptionListCreateView.as_view(),
        name="prescription-list-create"
    ),

    path(
        "prescriptions/<int:pk>/",
        PrescriptionDetailView.as_view(),
        name="prescription-detail"
    ),


    # ========================================================
    # MODULE 8.5
    # PRESCRIPTION EXPIRY NOTIFICATION
    # ========================================================

    path(
        "prescriptions/expiry-check/",
        PrescriptionExpiryNotificationView.as_view(),
        name="prescription-expiry-check"
    ),


    # ========================================================
    # HEALTH CONDITIONS
    #
    # Patient's actual conditions
    # ========================================================

    path(
        "conditions/",
        ConditionListCreateView.as_view(),
        name="condition-list-create"
    ),


    # ========================================================
    # CONDITION OPTIONS
    #
    # Used by Add Medicine dropdown.
    #
    # This returns all available condition choices without
    # making them automatically Active for the patient.
    # ========================================================

    path(
        "conditions/options/",
        ConditionOptionsView.as_view(),
        name="condition-options"
    ),


    # ========================================================
    # CONDITION DETAIL
    # ========================================================

    path(
        "conditions/<int:condition_id>/",
        ConditionDetailView.as_view(),
        name="condition-detail"
    ),


    # ========================================================
    # MEDICINE DETAIL
    # ========================================================

    path(
        "<int:pk>/",
        MedicineDetailView.as_view(),
        name="medicine-detail"
    ),

]