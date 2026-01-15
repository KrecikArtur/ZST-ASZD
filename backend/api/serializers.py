from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BellData, Schedule, RegisterCode

class BellDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = BellData
        fields = ['id', 'status', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'bells', 'fire']

class ScheduleDataSerializer(serializers.ModelSerializer):
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