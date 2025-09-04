from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BellData
from .models import Schedule
from datetime import time
from .serializers import BellDataSerializer
from .serializers import ScheduleDataSerializer

class BellDataViewSet(viewsets.ModelViewSet):
    queryset = BellData.objects.all()
    serializer_class = BellDataSerializer

class ScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleDataSerializer
    queryset = Schedule.objects.all().order_by('option', 'hour')

    def get_queryset(self):
        queryset = super().get_queryset()
        option = self.request.query_params.get('option')
        if option:
            queryset = queryset.filter(option=option)
        return queryset

    @action(detail=False, methods=['put'], url_path=r'(?P<option>[^/]+)')
    def update_option(self, request, option=None):
        Schedule.objects.filter(option=option).delete()

        for item in request.data:
            h = item.get('hour')
            prebell = item.get('prebell', False)
            if isinstance(h, str):
                h_time = time.fromisoformat(h)
                Schedule.objects.create(option=option, hour=h_time, prebell=prebell)
            else:
                return Response({"error": "Invalid hour format"}, status=400)

        return Response({"status": "ok"})
