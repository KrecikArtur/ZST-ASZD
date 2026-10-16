from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import BellData, Schedule
from .serializers import ScheduleDataSerializer, BellDataSerializer, RegisterSerializer
from datetime import datetime, time
from zoneinfo import ZoneInfo
from django.db import transaction

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"response": serializer.errors}, status=201)
        serializer.save()
        return Response({"response": "success"}, status=201)

class BellDataViewSet(viewsets.ModelViewSet):
    queryset = BellData.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BellDataSerializer
    lookup_field = 'setting'
    lookup_value_regex = r'[^/]+'
    http_method_names = ['get', 'patch', 'head', 'options']

    def perform_update(self, serializer):
        setting = serializer.instance.setting
        today = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')[
            datetime.now(ZoneInfo('Europe/Warsaw')).weekday()
        ]
        with transaction.atomic():
            serializer.save()
            if setting == f'plan.{today}':
                BellData.objects.filter(setting='plan.override').update(value=None)

class ScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Schedule.objects.all().order_by('option', 'lesson')
    lookup_field = 'option'

    def get_queryset(self):
        queryset = super().get_queryset()
        option = self.request.query_params.get('option')
        if option:
            queryset = queryset.filter(option=option)
        return queryset

    # override update for PUT /schedule/<option>/
    def update(self, request, *args, **kwargs):
        option = kwargs.get('option')
        if option not in {'normalny', 'alternatywny_a', 'alternatywny_b', 'alternatywny_c', 'wylaczony'}:
            return Response(
                {"error": "Unknown schedule option"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of schedule entries"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                Schedule.objects.filter(option=option).delete()
                for item in request.data:
                    lesson_raw = item.get('lesson')
                    brake_raw = item.get('brake')
                    lesson_time = time.fromisoformat(lesson_raw)
                    brake_time = time.fromisoformat(brake_raw)
                    Schedule.objects.create(
                        option=option,
                        lesson=lesson_time,
                        brake=brake_time
                    )
            return Response({"status": "ok"}, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Invalid time format. Use HH:MM[:SS]"},
                status=status.HTTP_400_BAD_REQUEST
            )
