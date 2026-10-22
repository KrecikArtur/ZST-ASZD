const { execFileSync } = require('child_process');
const net = require('net');
const LCDSCREEN = require('raspberrypi-liquid-crystal');

const lcd = new LCDSCREEN(1, 0x27, 16, 2);

function showProgress(stage) {
  lcd.clearSync();
  lcd.printSync('INICJALIZACJA');
  lcd.setCursorSync(0, 1);
  lcd.printSync(stage);
}

function isActive(unit) {
  try {
    execFileSync('systemctl', ['is-active', '--quiet', unit], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isTimeSynchronized() {
  try {
    return execFileSync('timedatectl', ['show', '-p', 'NTPSynchronized', '--value'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() === 'yes';
  } catch {
    return false;
  }
}

function backendAcceptsConnections() {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 8010 });
    const finish = ready => {
      socket.destroy();
      resolve(ready);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor(check) {
  while (!(await check())) await sleep(1000);
}

async function main() {
  lcd.beginSync();
  showProgress('SIECI');

  if (process.argv[2] === '--show-network-stage') return;

  await waitFor(() => isActive('network-online.target'));
  await waitFor(isTimeSynchronized);
  showProgress('STRONY');

  await waitFor(async () => isActive('bell-backend.service') && backendAcceptsConnections());
  showProgress('DZWONKA');

  await waitFor(() => isActive('bell-site.service'));
}

main().catch(error => {
  console.error('Nie można wyświetlić postępu uruchamiania:', error);
  process.exitCode = 1;
});
