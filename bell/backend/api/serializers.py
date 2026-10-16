from datetime import date
import re

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BellData, Schedule, RegisterCode

class BellDataSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    setting = serializers.CharField(read_only=True)
    value = serializers.JSONField(allow_null=True)

    class Meta:
        model = BellData
        fields = ['id', 'setting', 'value']

    def validate_value(self, value):
        setting = self.instance.setting if self.instance else None
        valid_modes = {
            'normalny', 'wylaczony', 'alternatywny_a',
            'alternatywny_b', 'alternatywny_c'
        }
        if setting == 'status' and (
            not isinstance(value, str)
            or value not in {'normalny', 'dzwonek', 'alarm_pozarowy', 'alarm_barykada'}
        ):
            raise serializers.ValidationError('Nieznany stan dzwonka.')

        if setting and setting.startswith('plan.') and setting != 'plan.override':
            if not isinstance(value, str) or value not in valid_modes:
                raise serializers.ValidationError('Nieznany tryb planu.')

        if setting == 'plan.override':
            if value is not None:
                if not isinstance(value, dict) or set(value) != {'date', 'mode'}:
                    raise serializers.ValidationError('Nieprawidłowe tymczasowe ustawienie planu.')
                if (not isinstance(value.get('date'), str)
                    or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value['date'])
                    or not isinstance(value.get('mode'), str)):
                    raise serializers.ValidationError('Nieprawidłowe tymczasowe ustawienie planu.')
                try:
                    date.fromisoformat(value['date'])
                except ValueError as exc:
                    raise serializers.ValidationError('Data musi być w formacie RRRR-MM-DD.') from exc
                if value['mode'] not in valid_modes:
                    raise serializers.ValidationError('Nieznany tryb planu.')

        if setting and (setting.startswith('bell.') or setting.startswith('alarm.fire.')):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 5:
                raise serializers.ValidationError('Wartość musi być liczbą z zakresu 0–5.')
            if setting == 'bell.normal' and value == 0:
                raise serializers.ValidationError('Czas dzwonka musi być większy od zera.')
            if setting == 'alarm.fire.signal_length' and value == 0:
                raise serializers.ValidationError('Długość sygnału musi być większa od zera.')
        return value

class ScheduleDataSerializer(serializers.ModelSerializer):
    option = serializers.ChoiceField(choices=[
        'normalny', 'wylaczony', 'alternatywny_a',
        'alternatywny_b', 'alternatywny_c'
    ], read_only=True)

    class Meta:
        model = Schedule
        fields = ['id', 'option', 'lesson', 'brake']

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=25)
    password = serializers.CharField(write_only=True)
    code = serializers.CharField(max_length=25)
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("username")
        return value
    def validate_code(self, value):
        if not RegisterCode.objects.filter(code=value).exists():
            raise serializers.ValidationError("code")
        return value
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"]
        )
        RegisterCode.objects.filter(code=validated_data["code"]).delete()
        return user
