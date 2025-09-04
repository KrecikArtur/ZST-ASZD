from django.db import models

class Schedule(models.Model):
    hour = models.TimeField()
    option = models.CharField(max_length=4)
    prebell = models.BooleanField(default=False)
    class Meta:
        ordering = ['option', 'hour']
    def __str__(self):
        return f"{self.option} - {self.hour} - {'Break' if self.is_break else 'Class'}"

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
