#!/usr/bin/env bash
set -Eeuo pipefail

# Run on Raspberry Pi OS as root. Optional overrides:
# BELL_GIT_URL, BELL_GIT_REF, BELL_NET_IFACE, BELL_DNS.
# Once pushed, download this root-level file from:
# https://raw.githubusercontent.com/KrecikArtur/ZST-ASZD/deploy/install-raspberry-pi.sh
BELL_GIT_URL="${BELL_GIT_URL:-https://github.com/KrecikArtur/ZST-ASZD.git}"
BELL_GIT_REF="${BELL_GIT_REF:-deploy}"
BELL_DNS="${BELL_DNS:-192.168.16.2}"
BELL_ADDRESS="192.168.17.250/23"
BELL_GATEWAY="192.168.16.2"
APP_ROOT=/opt/bell
DATA_ROOT=/var/lib/bell
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Uruchom instalator przez sudo jako root."
[[ -r /etc/os-release && -r /proc/device-tree/model ]] || die "System nie wygląda na Raspberry Pi OS."
. /etc/os-release
[[ "${ID:-}" == raspbian || "${ID:-}" == debian || "${ID_LIKE:-}" == *debian* ]] || die "Wymagany jest Raspberry Pi OS / Debian."
MODEL="$(tr -d '\0' </proc/device-tree/model)"
[[ "$MODEL" == *"Raspberry Pi 5"* ]] || die "Wykryto '$MODEL'; wymagany jest Raspberry Pi 5."

log "Instalowanie wymaganych pakietów systemowych"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y git ca-certificates curl nginx nodejs npm python3 python3-venv \
    python3-dev build-essential pkg-config libgpiod3 libgpiod-dev gpiod \
    libsqlite3-dev sqlite3 i2c-tools avahi-daemon systemd-timesyncd rsync openssl
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( NODE_MAJOR >= 18 )) || die "Express 5 wymaga Node.js 18 lub nowszego."

log "Pobieranie bell i plików wdrożeniowych z GitHuba"
git clone --depth 1 --filter=blob:none --sparse --branch "$BELL_GIT_REF" \
    "$BELL_GIT_URL" "$TMP_ROOT/repository"
git -C "$TMP_ROOT/repository" sparse-checkout set bell deploy
REPO="$TMP_ROOT/repository"
[[ -f "$REPO/bell/site/index.js" ]] || die "Repozytorium nie zawiera bell/site/index.js."
[[ -f "$REPO/bell/site/public/index.html" ]] || die "Brakuje gotowego bell/site/public/index.html."
[[ -f "$REPO/bell/backend/manage.py" ]] || die "Brakuje backendu Django."
[[ -f "$REPO/deploy/bell-site.service" ]] || die "Brakuje szablonów usług w deploy/."

log "Tworzenie konta usługi i kopiowanie gotowych plików"
getent group gpio >/dev/null || groupadd --system gpio
getent group i2c >/dev/null || groupadd --system i2c
if ! id bell >/dev/null 2>&1; then
    useradd --system --home-dir "$APP_ROOT" --create-home --shell /usr/sbin/nologin --user-group bell
fi
usermod -aG gpio,i2c bell
install -d -o root -g root -m 0755 "$APP_ROOT" "$APP_ROOT/site" "$APP_ROOT/backend"
install -d -o bell -g bell -m 0750 "$DATA_ROOT"
rsync -a --delete --exclude node_modules --exclude venv --exclude db.sqlite3 \
    "$REPO/bell/site/" "$APP_ROOT/site/"
rsync -a --delete --exclude venv --exclude db.sqlite3 \
    "$REPO/bell/backend/" "$APP_ROOT/backend/"
if [[ ! -e "$DATA_ROOT/db.sqlite3" && -f "$REPO/bell/backend/db.sqlite3" ]]; then
    install -o bell -g bell -m 0640 "$REPO/bell/backend/db.sqlite3" "$DATA_ROOT/db.sqlite3"
fi
chown -R root:bell "$APP_ROOT"
chmod -R u=rwX,g=rX,o= "$APP_ROOT"

log "Generowanie i zabezpieczanie sekretów aplikacji"
install -d -o root -g root -m 0700 /etc/bell
if [[ ! -f /etc/bell/dzwonek.env ]]; then
    {
        printf 'DJANGO_SECRET_KEY=%s\n' "$(openssl rand -hex 48)"
        printf 'JWT_SIGNING_KEY=%s\n' "$(openssl rand -hex 48)"
        printf 'DJANGO_ALLOWED_HOSTS=bell.local,localhost,127.0.0.1,192.168.17.250\n'
    } >/etc/bell/dzwonek.env
fi
grep -q '^DJANGO_SECRET_KEY=.' /etc/bell/dzwonek.env || die "Brak DJANGO_SECRET_KEY w /etc/bell/dzwonek.env."
grep -q '^JWT_SIGNING_KEY=.' /etc/bell/dzwonek.env || die "Brak JWT_SIGNING_KEY w /etc/bell/dzwonek.env."
chown root:root /etc/bell/dzwonek.env
chmod 0600 /etc/bell/dzwonek.env

log "Instalowanie pakietów Django i Node.js"
python3 -m venv "$APP_ROOT/backend/venv"
"$APP_ROOT/backend/venv/bin/pip" install --upgrade pip
"$APP_ROOT/backend/venv/bin/pip" install -r "$APP_ROOT/backend/requirements.txt"
chown -R root:bell "$APP_ROOT/backend/venv"
chmod -R o-rwx "$APP_ROOT/backend/venv"
cd "$APP_ROOT/site"
npm install --omit=dev --no-audit --no-fund
cd - >/dev/null

log "Migracje i przygotowanie bazy danych"
set -a
. /etc/bell/dzwonek.env
set +a
export BELL_DATABASE_PATH="$DATA_ROOT/db.sqlite3"
export DJANGO_ALLOWED_HOSTS="bell.local,localhost,127.0.0.1,192.168.17.250"
cd "$APP_ROOT/backend"
"$APP_ROOT/backend/venv/bin/python" manage.py migrate --noinput
INIT_OUTPUT="$("$APP_ROOT/backend/venv/bin/python" manage.py initialize_bell)"
chown bell:bell "$DATA_ROOT/db.sqlite3"
chmod 0640 "$DATA_ROOT/db.sqlite3"
chown -R bell:bell "$DATA_ROOT"
cd - >/dev/null

log "Ustawianie czasu lokalnego i usług nazw"
timedatectl set-timezone Europe/Warsaw
timedatectl set-ntp true
systemctl enable --now systemd-timesyncd
hostnamectl set-hostname bell
systemctl enable --now avahi-daemon
cat >/etc/udev/rules.d/99-bell-gpio.rules <<'EOF'
SUBSYSTEM=="gpio", KERNEL=="gpiochip*", GROUP="gpio", MODE="0660"
EOF
udevadm control --reload-rules
udevadm trigger --subsystem-match=gpio
install -d -o root -g root -m 0755 /usr/local/lib/bell
install -o root -g root -m 0755 "$REPO/deploy/wait-for-time-sync.sh" /usr/local/lib/bell/wait-for-time-sync.sh
install -o root -g root -m 0644 "$REPO/deploy/bell-backend.service" /etc/systemd/system/bell-backend.service
install -o root -g root -m 0644 "$REPO/deploy/bell-site.service" /etc/systemd/system/bell-site.service
install -o root -g root -m 0644 "$REPO/deploy/nginx-bell.conf" /etc/nginx/sites-available/bell
rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/bell /etc/nginx/sites-enabled/bell
nginx -t

log "Konfiguracja adresu 192.168.17.250/23"
NET_IFACE="${BELL_NET_IFACE:-$(ip -o route show default 2>/dev/null | awk 'NR == 1 {print $5}')}"
[[ -n "$NET_IFACE" ]] || die "Nie wykryto interfejsu; ustaw BELL_NET_IFACE=eth0 albo wlan0."
if command -v nmcli >/dev/null 2>&1 && systemctl is-active --quiet NetworkManager; then
    CONNECTION="$(nmcli -g GENERAL.CONNECTION device show "$NET_IFACE" | head -n1)"
    if [[ -z "$CONNECTION" || "$CONNECTION" == -- ]]; then
        DEVICE_TYPE="$(nmcli -g GENERAL.TYPE device show "$NET_IFACE" | head -n1)"
        [[ "$DEVICE_TYPE" == ethernet ]] || die "Brak zapisanego połączenia dla $NET_IFACE; skonfiguruj najpierw Wi-Fi."
        CONNECTION="bell-static-$NET_IFACE"
        nmcli connection add type ethernet ifname "$NET_IFACE" con-name "$CONNECTION" \
            ipv4.method manual ipv4.addresses "$BELL_ADDRESS" ipv4.gateway "$BELL_GATEWAY" \
            ipv4.dns "$BELL_DNS" ipv6.method auto
    else
        nmcli connection modify "$CONNECTION" ipv4.method manual ipv4.addresses "$BELL_ADDRESS" \
            ipv4.gateway "$BELL_GATEWAY" ipv4.dns "$BELL_DNS"
    fi
    NETWORK_APPLY=(nmcli connection up "$CONNECTION" ifname "$NET_IFACE")
elif command -v dhcpcd >/dev/null 2>&1; then
    python3 - "$NET_IFACE" "$BELL_ADDRESS" "$BELL_GATEWAY" "$BELL_DNS" <<'PY'
from pathlib import Path
import sys

iface, address, gateway, dns = sys.argv[1:]
path = Path('/etc/dhcpcd.conf')
old = path.read_text() if path.exists() else ''
begin, end = '# BEGIN school-bell static network', '# END school-bell static network'
result, skipping = [], False
for line in old.splitlines():
    if line == begin:
        skipping = True
        continue
    if line == end:
        skipping = False
        continue
    if not skipping:
        result.append(line)
result.extend(['', begin, f'interface {iface}', f'    static ip_address={address}',
               f'    static routers={gateway}', f'    static domain_name_servers={dns}', end])
path.write_text('\n'.join(result) + '\n')
PY
    NETWORK_APPLY=(systemctl restart dhcpcd)
else
    die "Brak aktywnego NetworkManager lub dhcpcd; nie zmieniono konfiguracji sieci."
fi

log "Włączanie Nginx i usług aplikacji"
systemctl daemon-reload
systemctl enable bell-backend.service bell-site.service nginx
systemctl restart nginx
systemctl restart bell-backend.service
systemctl restart bell-site.service

log "Zastosowanie adresu sieciowego (bieżące połączenie SSH może zostać przerwane)"
"${NETWORK_APPLY[@]}"

printf '\nInstalacja zakończona. Adres strony: http://bell.local/ lub http://192.168.17.250/\n'
[[ -z "$INIT_OUTPUT" ]] || printf '%s\n' "$INIT_OUTPUT"
