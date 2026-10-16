from django.db import migrations, models


PLAN_VALUES = {
    'norm': 'normalny',
    'dsbl': 'wylaczony',
    'alta': 'alternatywny_a',
    'altb': 'alternatywny_b',
    'altc': 'alternatywny_c',
}

STATUS_VALUES = {
    0: 'normalny',
    1: 'dzwonek',
    2: 'alarm_pozarowy',
    3: 'alarm_barykada',
}


def migrate_belldata_to_settings(apps, schema_editor):
    LegacyBellData = apps.get_model('api', 'LegacyBellData')
    BellData = apps.get_model('api', 'BellData')
    database = schema_editor.connection.alias
    old = LegacyBellData.objects.using(database).order_by('pk').first()
    if old is None:
        return

    values = {
        'status': STATUS_VALUES.get(old.status, 'normalny'),
    }
    for day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'):
        values[f'plan.{day}'] = PLAN_VALUES.get(getattr(old, day), 'normalny')

    bells = old.bells if isinstance(old.bells, list) else [2, 1]
    fire = old.fire if isinstance(old.fire, list) else [1, 0.5, 3.5]
    values.update({
        'bell.normal': bells[0] if len(bells) > 0 else 2,
        'bell.short': bells[1] if len(bells) > 1 else 1,
        'alarm.fire.signal_length': fire[0] if len(fire) > 0 else 1,
        'alarm.fire.pulse_gap': fire[1] if len(fire) > 1 else 0.5,
        'alarm.fire.cycle_gap': fire[2] if len(fire) > 2 else 3.5,
        'plan.override': None,
    })
    BellData.objects.using(database).bulk_create([
        BellData(setting=setting, value=value)
        for setting, value in values.items()
    ])


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_alter_schedule_options_rename_hour_schedule_lesson_and_more'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='BellData',
            new_name='LegacyBellData',
        ),
        migrations.CreateModel(
            name='BellData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('setting', models.CharField(max_length=80, unique=True)),
                ('value', models.JSONField(null=True)),
            ],
            options={
                'db_table': 'api_belldata',
                'ordering': ['setting'],
            },
        ),
        migrations.RunPython(migrate_belldata_to_settings, migrations.RunPython.noop),
        migrations.DeleteModel(name='LegacyBellData'),
    ]
