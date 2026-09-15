from datetime import date, timedelta
import re

from django.db import transaction

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from medicines.models import Medicine
from .models import RefillRecord

# ============================================================
# MODULE 8 - SMART NOTIFICATIONS
# ============================================================

from notifications.models import Notification


# ============================================================
# CONVERT FREQUENCY INTO DOSES PER DAY
# ============================================================

def get_doses_per_day(frequency):
    """
    Convert medicine frequency into doses per day.

    Examples:
        2 times daily -> 2
        2x daily      -> 2
        twice daily   -> 2
        three times   -> 3
        1-1-1         -> 3
        1-0-1         -> 2
        once daily    -> 1
    """

    if not frequency:
        return 1

    frequency = str(frequency).lower().strip()

    # Prescription notation
    notation_match = re.search(
        r"\b([0-9]+)[-/]([0-9]+)[-/]([0-9]+)\b",
        frequency
    )

    if notation_match:

        values = [
            int(notation_match.group(1)),
            int(notation_match.group(2)),
            int(notation_match.group(3)),
        ]

        return max(1, sum(values))

    # Numeric frequency
    numeric_match = re.search(
        r"\b(\d+)\s*(?:times|x)\b",
        frequency
    )

    if numeric_match:

        return max(
            1,
            int(numeric_match.group(1))
        )

    # Common descriptions
    if "four times" in frequency:
        return 4

    if "three times" in frequency:
        return 3

    if "twice" in frequency:
        return 2

    if "two times" in frequency:
        return 2

    if "once" in frequency:
        return 1

    if "daily" in frequency:
        return 1

    if "morning" in frequency:
        return 1

    if "afternoon" in frequency:
        return 1

    if "evening" in frequency:
        return 1

    if "night" in frequency:
        return 1

    return 1


# ============================================================
# CONVERT DOSAGE INTO QUANTITY PER DOSE
# ============================================================

def get_quantity_per_dose(dosage):
    """
    Extract quantity per dose.

    Examples:
        1 tablet  -> 1
        2 tablets -> 2
        1 capsule -> 1

    Important:
        500 mg does NOT mean 500 tablets.
    """

    if not dosage:
        return 1

    dosage = str(dosage).lower().strip()

    match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*"
        r"(?:tablet|tablets|pill|pills|"
        r"capsule|capsules|dose|doses)\b",
        dosage
    )

    if match:

        try:

            value = float(
                match.group(1)
            )

            return max(
                0.1,
                value
            )

        except (TypeError, ValueError):

            return 1

    return 1


# ============================================================
# CALCULATE REFILL PREDICTION
# ============================================================

def calculate_refill_prediction(medicine):
    """
    Calculate medicine stock and refill prediction.
    """

    # --------------------------------------------------------
    # Current stock
    # --------------------------------------------------------

    try:

        quantity = int(
            medicine.quantity
        )

    except (TypeError, ValueError):

        raise ValueError(
            "Medicine quantity is invalid."
        )

    if quantity < 0:

        raise ValueError(
            "Medicine quantity cannot be negative."
        )

    # --------------------------------------------------------
    # Dosage information
    # --------------------------------------------------------

    doses_per_day = get_doses_per_day(
        medicine.frequency
    )

    quantity_per_dose = get_quantity_per_dose(
        medicine.dosage
    )

    # --------------------------------------------------------
    # Daily consumption
    # --------------------------------------------------------

    daily_consumption = (
        doses_per_day *
        quantity_per_dose
    )

    if daily_consumption <= 0:

        daily_consumption = 1

    # --------------------------------------------------------
    # Remaining days
    # --------------------------------------------------------

    remaining_days = (
        quantity /
        daily_consumption
    )

    today = date.today()

    # --------------------------------------------------------
    # Estimated depletion date
    # --------------------------------------------------------

    depletion_date = (
        today +
        timedelta(
            days=int(remaining_days)
        )
    )

    # --------------------------------------------------------
    # Refill warning period
    # --------------------------------------------------------

    refill_warning_days = 5

    # --------------------------------------------------------
    # Recommended refill date
    # --------------------------------------------------------

    if remaining_days <= refill_warning_days:

        recommended_refill_date = today

    else:

        recommended_refill_date = (
            depletion_date -
            timedelta(
                days=refill_warning_days
            )
        )

    # --------------------------------------------------------
    # Stock status
    # --------------------------------------------------------

    out_of_stock = quantity <= 0

    low_stock = (
        remaining_days <=
        refill_warning_days
    )

    if out_of_stock:

        stock_status = "Out of Stock"

    elif low_stock:

        stock_status = "Low Stock"

    else:

        stock_status = "Sufficient Stock"

    # --------------------------------------------------------
    # Message
    # --------------------------------------------------------

    if out_of_stock:

        message = (
            "Medicine is out of stock. "
            "Please arrange a refill immediately."
        )

    elif low_stock:

        message = (
            "Medicine stock is running low. "
            "Please arrange a refill."
        )

    else:

        message = (
            "Medicine stock is sufficient."
        )

    return {

        "doses_per_day":
            doses_per_day,

        "quantity_per_dose":
            quantity_per_dose,

        "daily_consumption":
            round(
                daily_consumption,
                2
            ),

        "remaining_stock":
            quantity,

        "estimated_remaining_days":
            round(
                remaining_days,
                2
            ),

        "estimated_depletion_date":
            depletion_date.isoformat(),

        "recommended_refill_date":
            recommended_refill_date.isoformat(),

        "low_stock":
            low_stock,

        "out_of_stock":
            out_of_stock,

        "stock_status":
            stock_status,

        "refill_warning_days":
            refill_warning_days,

        "message":
            message,
    }


# ============================================================
# CREATE REFILL NOTIFICATION
# MODULE 8
# ============================================================

def create_refill_notification(
    user,
    medicine,
    prediction
):
    """
    Create a refill notification when medicine stock
    becomes low or reaches zero.

    Prevents duplicate unread notifications
    for the same medicine.
    """

    if not (
        prediction.get("low_stock")
        or
        prediction.get("out_of_stock")
    ):

        return None

    # --------------------------------------------------------
    # Prevent duplicate unread notification
    # --------------------------------------------------------

    existing_notification = Notification.objects.filter(
        user=user,
        notification_type="refill",
        is_read=False,
        message__icontains=medicine.medicine_name
    ).first()

    if existing_notification:

        return existing_notification

    # --------------------------------------------------------
    # Out of stock notification
    # --------------------------------------------------------

    if prediction.get("out_of_stock"):

        notification = Notification.objects.create(
            user=user,
            notification_type="refill",
            title="Medicine Out of Stock",
            message=(
                f"{medicine.medicine_name} is out of stock. "
                f"Please refill your medicine as soon as possible."
            )
        )

        return notification

    # --------------------------------------------------------
    # Low stock notification
    # --------------------------------------------------------

    notification = Notification.objects.create(
        user=user,
        notification_type="refill",
        title="Low Medicine Stock",
        message=(
            f"{medicine.medicine_name} is running low. "
            f"Recommended refill date: "
            f"{prediction['recommended_refill_date']}."
        )
    )

    return notification


# ============================================================
# REFILL PREDICTION VIEW
# ============================================================

class RefillPredictionView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, medicine_id):

        try:

            medicine = Medicine.objects.get(
                id=medicine_id,
                user=request.user
            )

        except Medicine.DoesNotExist:

            return Response(
                {
                    "error":
                        "Medicine not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            prediction = calculate_refill_prediction(
                medicine
            )

        except ValueError as error:

            return Response(
                {
                    "error":
                        str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ====================================================
        # MODULE 8
        # CREATE REFILL NOTIFICATION
        # ====================================================

        notification = create_refill_notification(
            request.user,
            medicine,
            prediction
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        response_data = {

            "medicine": {

                "id":
                    medicine.id,

                "medicine_name":
                    medicine.medicine_name,

                "dosage":
                    medicine.dosage,

                "quantity":
                    medicine.quantity,

                "frequency":
                    medicine.frequency,
            },

            "prediction":
                prediction,

            "message":
                prediction["message"],
        }

        if notification:

            response_data[
                "notification"
            ] = {

                "id":
                    notification.id,

                "title":
                    notification.title,

                "notification_type":
                    notification.notification_type,

                "created":
                    True,
            }

        else:

            response_data[
                "notification"
            ] = None

        return Response(
            response_data,
            status=status.HTTP_200_OK
        )


# ============================================================
# MANUAL STOCK UPDATE / REFILL
# ============================================================

class ManualStockUpdateView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request, medicine_id):

        try:

            medicine = (
                Medicine.objects
                .select_for_update()
                .get(
                    id=medicine_id,
                    user=request.user
                )
            )

        except Medicine.DoesNotExist:

            return Response(
                {
                    "error":
                        "Medicine not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        quantity_added = request.data.get(
            "quantity_added"
        )

        notes = request.data.get(
            "notes",
            ""
        )

        # ----------------------------------------------------
        # Validate quantity
        # ----------------------------------------------------

        if quantity_added is None:

            return Response(
                {
                    "error":
                        "quantity_added is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            quantity_added = int(
                quantity_added
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "error":
                        "Quantity added must be a valid number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity_added <= 0:

            return Response(
                {
                    "error":
                        "Quantity added must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Current stock
        # ----------------------------------------------------

        try:

            stock_before = int(
                medicine.quantity
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "error":
                        "Current medicine quantity is invalid."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if stock_before < 0:

            return Response(
                {
                    "error":
                        "Current medicine stock cannot be negative."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Calculate new stock
        # ----------------------------------------------------

        stock_after = (
            stock_before +
            quantity_added
        )

        # ----------------------------------------------------
        # Update medicine
        # ----------------------------------------------------

        medicine.quantity = stock_after

        medicine.save(
            update_fields=[
                "quantity"
            ]
        )

        # ----------------------------------------------------
        # Create refill record
        # ----------------------------------------------------

        refill_record = RefillRecord.objects.create(
            user=request.user,
            medicine=medicine,
            quantity_added=quantity_added,
            stock_before=stock_before,
            stock_after=stock_after,
            notes=str(
                notes
            ).strip()
        )

        # ----------------------------------------------------
        # Recalculate prediction
        # ----------------------------------------------------

        try:

            prediction = calculate_refill_prediction(
                medicine
            )

        except ValueError:

            prediction = {}

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return Response(
            {
                "message":
                    "Medicine stock updated successfully.",

                "refill": {

                    "id":
                        refill_record.id,

                    "medicine_id":
                        medicine.id,

                    "medicine_name":
                        medicine.medicine_name,

                    "quantity_added":
                        quantity_added,

                    "stock_before":
                        stock_before,

                    "stock_after":
                        stock_after,

                    "refill_date":
                        refill_record.refill_date,

                    "notes":
                        refill_record.notes,
                },

                "prediction":
                    prediction,
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# REFILL HISTORY
# ============================================================

class RefillHistoryView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        records = (
            RefillRecord.objects
            .filter(
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .order_by(
                "-refill_date"
            )
        )

        history = []

        for record in records:

            history.append(
                {
                    "id":
                        record.id,

                    "medicine_id":
                        record.medicine.id,

                    "medicine_name":
                        record.medicine.medicine_name,

                    "quantity_added":
                        record.quantity_added,

                    "stock_before":
                        record.stock_before,

                    "stock_after":
                        record.stock_after,

                    "refill_date":
                        record.refill_date,

                    "notes":
                        record.notes or "",
                }
            )

        return Response(
            {
                "count":
                    len(history),

                "history":
                    history,
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# REFILL ANALYTICS
# MODULE 6
# ============================================================

class RefillAnalyticsView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        # ====================================================
        # GET USER MEDICINES
        # ====================================================

        medicines = (
            Medicine.objects
            .filter(
                user=request.user
            )
            .order_by(
                "medicine_name"
            )
        )

        # ====================================================
        # GET REFILL RECORDS
        # ====================================================

        records = (
            RefillRecord.objects
            .filter(
                user=request.user
            )
            .select_related(
                "medicine"
            )
            .order_by(
                "-refill_date"
            )
        )

        # ====================================================
        # REFILL HISTORY TOTALS
        # ====================================================

        total_refills = records.count()

        total_quantity_added = sum(
            record.quantity_added
            for record in records
        )

        # ====================================================
        # STOCK STATUS COUNTERS
        # ====================================================

        total_medicines = medicines.count()

        sufficient_stock = 0

        low_stock = 0

        out_of_stock = 0

        # ====================================================
        # MEDICINE ANALYSIS
        # ====================================================

        medicine_analysis = []

        # ====================================================
        # ANALYZE EVERY MEDICINE
        # ====================================================

        for medicine in medicines:

            try:

                prediction = calculate_refill_prediction(
                    medicine
                )

            except ValueError as error:

                # If a medicine contains invalid stock data,
                # still return it with an error status.
                medicine_analysis.append(
                    {
                        "medicine_id":
                            medicine.id,

                        "medicine_name":
                            medicine.medicine_name,

                        "current_stock":
                            medicine.quantity,

                        "daily_consumption":
                            0,

                        "remaining_days":
                            0,

                        "depletion_date":
                            None,

                        "recommended_refill_date":
                            None,

                        "stock_status":
                            "Invalid",

                        "low_stock":
                            False,

                        "out_of_stock":
                            False,

                        "refill_count":
                            0,

                        "total_quantity_added":
                            0,

                        "last_refill_date":
                            None,

                        "error":
                            str(error),
                    }
                )

                continue

            # =================================================
            # STOCK STATUS
            # =================================================

            stock_status = prediction.get(
                "stock_status",
                "Unknown"
            )

            if stock_status == "Sufficient Stock":

                sufficient_stock += 1

            elif stock_status == "Low Stock":

                low_stock += 1

            elif stock_status == "Out of Stock":

                out_of_stock += 1

            # =================================================
            # MEDICINE REFILL RECORDS
            # =================================================

            medicine_records = [
                record
                for record in records
                if record.medicine_id == medicine.id
            ]

            medicine_refill_count = len(
                medicine_records
            )

            medicine_quantity_added = sum(
                record.quantity_added
                for record in medicine_records
            )

            # =================================================
            # LAST REFILL DATE
            # =================================================

            last_refill_date = None

            if medicine_records:

                last_refill_date = (
                    medicine_records[0].refill_date
                )

            # =================================================
            # MEDICINE ANALYSIS OBJECT
            # =================================================

            medicine_analysis.append(
                {
                    "medicine_id":
                        medicine.id,

                    "medicine_name":
                        medicine.medicine_name,

                    "current_stock":
                        prediction.get(
                            "remaining_stock",
                            medicine.quantity
                        ),

                    "daily_consumption":
                        prediction.get(
                            "daily_consumption",
                            0
                        ),

                    "remaining_days":
                        prediction.get(
                            "estimated_remaining_days",
                            0
                        ),

                    "depletion_date":
                        prediction.get(
                            "estimated_depletion_date"
                        ),

                    "recommended_refill_date":
                        prediction.get(
                            "recommended_refill_date"
                        ),

                    "stock_status":
                        stock_status,

                    "low_stock":
                        prediction.get(
                            "low_stock",
                            False
                        ),

                    "out_of_stock":
                        prediction.get(
                            "out_of_stock",
                            False
                        ),

                    "refill_count":
                        medicine_refill_count,

                    "total_quantity_added":
                        medicine_quantity_added,

                    "last_refill_date":
                        (
                            last_refill_date.isoformat()
                            if last_refill_date
                            else None
                        ),
                }
            )

        # ====================================================
        # MOST REFILLED MEDICINE
        # ====================================================

        most_refilled_medicine = None

        medicines_with_refills = [
            medicine
            for medicine in medicine_analysis
            if medicine.get(
                "refill_count",
                0
            ) > 0
        ]

        if medicines_with_refills:

            most_refilled_medicine = max(
                medicines_with_refills,
                key=lambda item:
                    item.get(
                        "refill_count",
                        0
                    )
            )

        # ====================================================
        # RESPONSE
        # ====================================================

        return Response(
            {
                # ==================================================
                # SUMMARY
                # ==================================================

                "summary": {

                    "total_medicines":
                        total_medicines,

                    "sufficient_stock":
                        sufficient_stock,

                    "low_stock":
                        low_stock,

                    "out_of_stock":
                        out_of_stock,

                    "total_refills":
                        total_refills,

                    "total_quantity_added":
                        total_quantity_added,

                    "unique_medicines_refilled":
                        len(
                            medicines_with_refills
                        ),

                    "most_refilled_medicine":
                        most_refilled_medicine,
                },

                # ==================================================
                # MEDICINE-WISE ANALYSIS
                # ==================================================

                "medicine_analysis":
                    medicine_analysis,

                # ==================================================
                # STOCK STATUS SUMMARY
                # ==================================================

                "stock_status": {

                    "sufficient_stock":
                        sufficient_stock,

                    "low_stock":
                        low_stock,

                    "out_of_stock":
                        out_of_stock,
                },

                # ==================================================
                # REFILL SUMMARY
                # ==================================================

                "refill_summary": {

                    "total_refills":
                        total_refills,

                    "total_quantity_added":
                        total_quantity_added,

                    "unique_medicines_refilled":
                        len(
                            medicines_with_refills
                        ),
                },
            },
            status=status.HTTP_200_OK
        )