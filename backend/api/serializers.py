from rest_framework import serializers
from .models import BellData
from .models import Schedule

class BellDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = BellData
        fields = ['id', 'status', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'bells', 'fire']

class ScheduleDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['id', 'option', 'hour', 'prebell']