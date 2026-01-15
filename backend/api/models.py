from django.db import models

class Schedule(models.Model):
    option = models.CharField(max_length=4, db_index=True)
    lesson = models.TimeField()
    brake = models.TimeField()
    class Meta:
        ordering = ['option', 'lesson']
    def __str__(self):
        return f"{self.option} - {self.lesson}"

class BellData(models.Model):
    status = models.IntegerField()
    monday = models.CharField(max_length=4, null=True, blank=True)
    tuesday = models.CharField(max_length=4, null=True, blank=True)
    wednesday = models.CharField(max_length=4, null=True, blank=True)
    thursday = models.CharField(max_length=4, null=True, blank=True)
    friday = models.CharField(max_length=4, null=True, blank=True)
    saturday = models.CharField(max_length=4, null=True, blank=True)
    sunday = models.CharField(max_length=4, null=True, blank=True)
    bells = models.JSONField(default=list)
    fire = models.JSONField(default=list)
    def __str__(self):
        return f"BellData (status={self.status})"

class RegisterCode(models.Model):
    code = models.CharField(max_length=25, unique=True)
    class Meta:
        db_table = 'api_registercode'
    def __str__(self):
        return self.code