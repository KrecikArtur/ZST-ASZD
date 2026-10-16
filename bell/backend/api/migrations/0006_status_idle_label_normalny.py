from django.db import migrations


def rename_idle_status(apps, schema_editor, old_value, new_value):
    BellData = apps.get_model('api', 'BellData')
    database = schema_editor.connection.alias
    row = BellData.objects.using(database).filter(setting='status').first()
    if row is not None and row.value == old_value:
        row.value = new_value
        row.save(using=database, update_fields=['value'])


def forward(apps, schema_editor):
    rename_idle_status(apps, schema_editor, 'gotowy', 'normalny')


def backward(apps, schema_editor):
    rename_idle_status(apps, schema_editor, 'normalny', 'gotowy')


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0005_readable_schedule_options'),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]
