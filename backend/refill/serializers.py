from rest_framework import serializers
from .models import RefillRecord


class RefillRecordSerializer(serializers.ModelSerializer):

    medicine_name = serializers.CharField(
        source="medicine.medicine_name",
        read_only=True
    )

    class Meta:
        model = RefillRecord

        fields = [
            "id",
            "medicine",
            "medicine_name",
            "quantity_added",
            "stock_before",
            "stock_after",
            "refill_date",
            "notes",
        ]

        read_only_fields = [
            "id",
            "medicine_name",
            "refill_date",
            "stock_before",
            "stock_after",
        ]