from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .prediction_service import predict_adherence


class AdherencePredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            result = predict_adherence(request.data)

            return Response({
                "message": "Adherence prediction successful",
                "prediction": result
            })

        except Exception as error:
            return Response(
                {
                    "message": "Prediction failed",
                    "error": str(error)
                },
                status=400
            )