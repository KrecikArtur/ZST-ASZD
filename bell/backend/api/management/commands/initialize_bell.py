import secrets
import string

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api.models import BellData, RegisterCode


class Command(BaseCommand):
    help = "Create the initial bell state and a one-time registration code when needed."

    def handle(self, *args, **options):
        BellData.objects.get_or_create(
            pk=1,
            defaults={
                "status": 0,
                "monday": "norm",
                "tuesday": "norm",
                "wednesday": "norm",
                "thursday": "norm",
                "friday": "norm",
                "saturday": "dsbl",
                "sunday": "dsbl",
                "bells": [2, 1],
                "fire": [1, 0.5, 3.5],
            },
        )
        if get_user_model().objects.exists() or RegisterCode.objects.exists():
            self.stdout.write("Bell state is ready; existing accounts and codes were preserved.")
            return
        alphabet = string.ascii_uppercase + string.digits
        code = "".join(secrets.choice(alphabet) for _ in range(20))
        RegisterCode.objects.create(code=code)
        self.stdout.write(self.style.SUCCESS(f"Initial one-time registration code: {code}"))
