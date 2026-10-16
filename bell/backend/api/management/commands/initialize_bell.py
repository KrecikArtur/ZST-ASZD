import secrets
import string

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api.models import BellData, RegisterCode


class Command(BaseCommand):
    help = "Create the initial bell state and a one-time registration code when needed."

    def handle(self, *args, **options):
        defaults = {
            "status": "normalny",
            "plan.monday": "normalny",
            "plan.tuesday": "normalny",
            "plan.wednesday": "normalny",
            "plan.thursday": "normalny",
            "plan.friday": "normalny",
            "plan.saturday": "wylaczony",
            "plan.sunday": "wylaczony",
            "bell.normal": 2,
            "bell.short": 1,
            "alarm.fire.signal_length": 1,
            "alarm.fire.pulse_gap": 0.5,
            "alarm.fire.cycle_gap": 3.5,
            "plan.override": None,
        }
        for setting, value in defaults.items():
            BellData.objects.get_or_create(setting=setting, defaults={"value": value})

        if get_user_model().objects.exists() or RegisterCode.objects.exists():
            self.stdout.write("Bell settings are ready; existing accounts and codes were preserved.")
            return
        alphabet = string.ascii_uppercase + string.digits
        code = "".join(secrets.choice(alphabet) for _ in range(20))
        RegisterCode.objects.create(code=code)
        self.stdout.write(self.style.SUCCESS(f"Initial one-time registration code: {code}"))
