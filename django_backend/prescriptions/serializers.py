from django.conf import settings
from rest_framework import serializers

from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True, default=None)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            "id", "patient_name", "doctor_name", "notes",
            "medicine", "medicine_name",
            "file", "file_url", "original_filename", "uploaded_at",
        ]
        extra_kwargs = {
            "file": {"write_only": True},
            "original_filename": {"required": False},
            "medicine": {"required": False, "allow_null": True},
        }

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def validate_patient_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("patient_name is required")
        return value.strip()

    def validate_file(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        allowed = settings.ALLOWED_PRESCRIPTION_EXTENSIONS
        if ext not in allowed:
            raise serializers.ValidationError(
                f"File type not allowed. Allowed types: {', '.join(sorted(allowed))}"
            )
        if value.size > settings.MAX_PRESCRIPTION_SIZE:
            max_mb = settings.MAX_PRESCRIPTION_SIZE // (1024 * 1024)
            raise serializers.ValidationError(f"File too large. Maximum allowed size is {max_mb} MB.")
        return value

    def create(self, validated_data):
        file_obj = validated_data.get("file")
        validated_data["original_filename"] = file_obj.name
        return super().create(validated_data)
