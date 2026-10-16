from django.db import models

class Schedule(models.Model):
    option = models.CharField(max_length=24, db_index=True)
    lesson = models.TimeField()
    brake = models.TimeField()
    class Meta:
        ordering = ['option', 'lesson']
    def __str__(self):
        return f"{self.option} - {self.lesson}"

class BellData(models.Model):
    setting = models.CharField(max_length=80, unique=True)
    value = models.JSONField(null=True)

    class Meta:
        db_table = 'api_belldata'
        ordering = ['setting']

    def __str__(self):
        return f"{self.setting}={self.value}"

class RegisterCode(models.Model):
    code = models.CharField(max_length=25, unique=True)
    class Meta:
        db_table = 'api_registercode'
    def __str__(self):
        return self.code
