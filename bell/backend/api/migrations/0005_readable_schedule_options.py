from django.db import migrations, models


OPTION_VALUES = {
    'norm': 'normalny',
    'dsbl': 'wylaczony',
    'alta': 'alternatywny_a',
    'altb': 'alternatywny_b',
    'altc': 'alternatywny_c',
}

REVERSE_OPTION_VALUES = {value: key for key, value in OPTION_VALUES.items()}


def migrate_schedule_options(apps, schema_editor):
    Schedule = apps.get_model('api', 'Schedule')
    database = schema_editor.connection.alias
    for old, new in OPTION_VALUES.items():
        Schedule.objects.using(database).filter(option=old).update(option=new)


def reverse_schedule_options(apps, schema_editor):
    Schedule = apps.get_model('api', 'Schedule')
    database = schema_editor.connection.alias
    for current, old in REVERSE_OPTION_VALUES.items():
        Schedule.objects.using(database).filter(option=current).update(option=old)


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0004_belldata_settings_rows'),
    ]

    operations = [
        migrations.AlterField(
            model_name='schedule',
            name='option',
            field=models.CharField(db_index=True, max_length=24),
        ),
        migrations.RunPython(migrate_schedule_options, reverse_schedule_options),
    ]
