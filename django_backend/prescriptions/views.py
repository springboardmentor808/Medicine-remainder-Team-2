from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Prescription
from .serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    """Upload Prescription (POST, multipart), Get Prescriptions (GET list),
    view a single record, and delete (which also removes the stored file)."""

    serializer_class = PrescriptionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Prescription.objects.select_related("medicine").all()
        params = self.request.query_params

        search = params.get("search")
        if search:
            qs = qs.filter(patient_name__icontains=search)

        medicine_id = params.get("medicine_id")
        if medicine_id:
            qs = qs.filter(medicine_id=medicine_id)

        return qs

    def get_serializer_context(self):
        return {"request": self.request}

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"count": len(serializer.data), "prescriptions": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({"prescription": self.get_serializer(instance).data})

    def create(self, request, *args, **kwargs):
        """This is the 'Upload Prescription' API: POST /api/prescriptions/
        as multipart/form-data with fields: file, patient_name, doctor_name
        (optional), notes (optional), medicine (optional, medicine id)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Prescription uploaded successfully", "prescription": serializer.data},
            status=201,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.file:
            instance.file.delete(save=False)  # remove the file from disk too
        instance.delete()
        return Response({"message": "Prescription deleted successfully"})
