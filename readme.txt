Szybki poradnik funkcjonowania sterownika:
1. Zainstaluj na Raspberry pi 4/5 system Raspberry OS lite (64)

2. Użyj poniższych komend do instalacji sterownika:
curl -fsSL https://raw.githubusercontent.com/KrecikArtur/ZST-ASZD/deploy/install-raspberry-pi.sh -o /tmp/install-bell.sh
sudo bash /tmp/install-bell.sh

3. Po ponownym uruchomieniu urządzenia powinno ono działać prawidłowo, jeśli jest w poprawnej sieci.

4. Aby dodać nowy kod rejestracyjny wpisz w terminalu:
sudo bash -c 'read -r -p "Wpisz kod rejestracyjny (do 25 znaków): " code; [[ -n "$code" && ${#code} -le 25 ]] || { echo "Kod musi mieć od 1 do 25 znaków."; exit 1; }; export BELL_REGISTRATION_CODE="$code"; set -a; . /etc/bell/dzwonek.env; set +a; export BELL_DATABASE_PATH=/var/lib/bell/db.sqlite3; cd /opt/bell/backend; ./venv/bin/python manage.py shell -c "import os; from api.models import RegisterCode; code=os.environ[\"BELL_REGISTRATION_CODE\"]; RegisterCode.objects.create(code=code); print(\"Dodano kod:\", code)"'