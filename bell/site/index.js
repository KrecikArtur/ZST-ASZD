//Rozruch wyswietlacza
const LCDSCREEN = require('raspberrypi-liquid-crystal');
const lcd = new LCDSCREEN( 1, 0x27, 16, 2 );
let displayInitialized = false;
//Wczytanie bazy danych
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(
  process.env.BELL_DATABASE_PATH || path.join(__dirname, '../backend/db.sqlite3')
);
const STATUS = {
  IDLE: 'normalny',
  MANUAL: 'dzwonek',
  FIRE: 'alarm_pozarowy',
  BARRICADE: 'alarm_barykada',
};
const PLAN_OPTIONS = {
  normalny: 'Normalny',
  alternatywny_a: 'Alternatywny A',
  alternatywny_b: 'Alternatywny B',
  alternatywny_c: 'Alternatywny C',
  wylaczony: 'Wylaczony',
};
const PLAN_CYCLE = ['normalny', 'alternatywny_a', 'alternatywny_b', 'alternatywny_c', 'wylaczony'];
function parseStoredValue(value) {
  try { return JSON.parse(value); } catch { return value; }
}

function getSetting(setting, callback) {
  db.get('SELECT "value" FROM api_belldata WHERE setting = ?', [setting], (err, row) => {
    callback(err, row ? parseStoredValue(row.value) : undefined);
  });
}

function setSetting(setting, value, callback = () => {}) {
  db.run('UPDATE api_belldata SET "value" = ? WHERE setting = ?', [JSON.stringify(value), setting], function (err) {
    if (!err && this.changes === 0) err = new Error(`Brak ustawienia ${setting}`);
    callback(err);
  });
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
//Uruchomienie strony internetowej
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get(/.*/, (req, res) => {res.sendFile(path.join(__dirname, 'public', 'index.html'));});
app.post('/bell/reload', (req, res) => {
  res.json({ success: true });
  Reload();
});
app.listen(3010, '127.0.0.1', () => {
  console.log(`Aktywacja Systemu: ${new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`);
});
//Zmienne!
const on = 0;
const off = 1;
let cyklpracy = 0;
let ringVersion = 0;
let activeMode = STATUS.IDLE;
let manualBellPendingUntil = 0;
let initialModeLoaded = false;
const lastButtonPress = new Map();
let weekday = '';
let bellhours = [];
let displaying = ["","",true];
let currentPlanMode = null;
let planMenuMode = null;
let planMenuTimer = null;

function closePlanMenu() {
  if (planMenuTimer) clearTimeout(planMenuTimer);
  planMenuTimer = null;
  planMenuMode = null;
}

//Obsluga przyciskow
const Gpio = require('@bratbit/onoff').Gpio;
// BCM line numbers are used by libgpiod on Raspberry Pi 5.
const bell = new Gpio(17, 'out');
bell.writeSync(off);
new Gpio(22, 'in', 'both').watch((err, value) => {
  if (err) return console.error('Blad odczytu GPIO 22:', err);
  if (value === 1) buttonpressed(1); // Przycisk 2: zatwierdzenie / anulowanie alarmu
});
new Gpio(27, 'in', 'both').watch((err, value) => {
  if (err) return console.error('Blad odczytu GPIO 27:', err);
  if (value === 1) buttonpressed(0); // Przycisk 1: wybor planu
});
new Gpio(23, 'in', 'both').watch((err, value) => {
  if (err) return console.error('Blad odczytu GPIO 23:', err);
  if (value === 1) buttonpressed(2); // Przycisk 3: alarm pozarowy
});
new Gpio(24, 'in', 'both').watch((err, value) => {
  if (err) return console.error('Blad odczytu GPIO 24:', err);
  if (value === 1) buttonpressed(3); // Przycisk 4: alarm barykada
});
function buttonpressed(button) {
  const now = Date.now();
  if (now - (lastButtonPress.get(button) || 0) < 300) return;
  lastButtonPress.set(button, now);

  if (button === 0) {
    if (activeMode !== STATUS.IDLE) return;
    if (planMenuMode === null) {
      planMenuMode = PLAN_OPTIONS[currentPlanMode] ? currentPlanMode : 'normalny';
    } else {
      const currentIndex = PLAN_CYCLE.indexOf(planMenuMode);
      planMenuMode = PLAN_CYCLE[currentIndex === -1 ? 0 : (currentIndex + 1) % PLAN_CYCLE.length];
    }
    if (planMenuTimer) clearTimeout(planMenuTimer);
    planMenuTimer = setTimeout(() => {
      planMenuTimer = null;
      planMenuMode = null;
      ScreenMessage();
    }, 10000);
    ScreenMessage();
    return;
  }

  if (button === 1) {
    if (activeMode !== STATUS.IDLE) {
      closePlanMenu();
      setSetting('status', STATUS.IDLE, err => {
        if (err) {
          console.error('Nie mozna anulowac alarmu:', err);
          return;
        }
        Reload();
      });
      return;
    }
    if (planMenuMode === null) return;
    const selectedMode = planMenuMode;
    const override = { date: localDateKey(), mode: selectedMode };
    setSetting('plan.override', override, err => {
      if (err) {
        console.error('Nie mozna zapisac tymczasowego planu:', err);
        return;
      }
      currentPlanMode = selectedMode;
      closePlanMenu();
      Reload();
    });
    return;
  }

  // Alarmy pozostaja dostepne niezaleznie od menu wyboru planu.
  closePlanMenu();
  const workingcycle = cyklpracy;
  const modes = [null, null, "ALARM POZAROWY", "ALARM BARYKADA"];
  const requestedStatus = [null, null, STATUS.FIRE, STATUS.BARRICADE][button];
  getSetting('status', (err, status) => {
    if (workingcycle !== cyklpracy) return;
    if (err || status === undefined) {
      console.error("Nie można odczytać stanu dzwonka:", err || "brak rekordu");
      return;
    }
    if (displaying[0] === modes[button]) {
      if (status === STATUS.IDLE) {
        setSetting('status', requestedStatus, err => {
          if (err) {
            console.error("Nie można zmienić stanu dzwonka:", err);
            return;
          }
          Reload();
        });
      }
    } else {
      if (workingcycle !== cyklpracy) return;
      displaying = [modes[button],"WYKONAC?",false];
      ScreenMessage();
      setTimeout(() => {
        if (workingcycle!==cyklpracy||displaying[0]!==modes[button]) return;
        displaying[2] = true;
        ScreenMessage();
      }, 5000);
    }
  });
}
//Przeladowanie stanu programu
function Reload() {
  closePlanMenu();
  bell.writeSync(off);
  bellhours = [];
  cyklpracy += 1;
  ringVersion += 1;
  const workingcycle = cyklpracy;
  getSetting('status', (err, requestedStatus) => {
    if (workingcycle !== cyklpracy) return;
    if (err || requestedStatus === undefined) {
      activeMode = STATUS.IDLE;
      displaying = ["BLAD", "BAZA DANYCH", false];
      console.error("Nie można odczytać stanu dzwonka:", err || "brak rekordu");
      ScreenMessage();
      return;
    }

    let requestedMode = requestedStatus;
    if (!initialModeLoaded) {
      initialModeLoaded = true;
      if (requestedMode === STATUS.MANUAL) {
        // A one-shot ring left behind by a crash must not ring again on reboot.
        requestedMode = STATUS.IDLE;
        setSetting('status', STATUS.IDLE, updateErr => {
          if (updateErr) console.error("Nie można wyczyścić starego polecenia dzwonka:", updateErr);
        });
      }
    }
    if (!Object.values(STATUS).includes(requestedMode)) {
      activeMode = STATUS.IDLE;
      displaying = ["BLAD", "NIEZNANY TRYB", false];
      console.error("Nieznany stan dzwonka:", requestedMode);
      ScreenMessage();
      return;
    }

    // Zwykły dzwonek nie może przerwać aktywnego alarmu ani go przełączyć.
    if (activeMode !== STATUS.IDLE && requestedMode !== STATUS.IDLE && requestedMode !== activeMode) {
      setSetting('status', activeMode, updateErr => {
        if (updateErr) console.error("Nie można przywrócić aktywnego alarmu:", updateErr);
      });
      activateMode(activeMode, workingcycle);
      ScreenMessage();
      return;
    }

    if (requestedMode === STATUS.MANUAL) {
      if (activeMode !== STATUS.IDLE || Date.now() < manualBellPendingUntil) {
        setSetting('status', activeMode);
        activateMode(activeMode, workingcycle);
        ScreenMessage();
        return;
      }
      manualBellPendingUntil = Date.now() + 5000;
      activeMode = STATUS.IDLE;
      displaying[2] = true;
      ring(0, workingcycle);
      setSetting('status', STATUS.IDLE, updateErr => {
        if (updateErr) console.error("Nie można wyzerować jednorazowego dzwonka:", updateErr);
      });
      StartBells();
      ScreenMessage();
      return;
    }

    manualBellPendingUntil = 0;
    activeMode = requestedMode;
    activateMode(requestedMode, workingcycle);
    ScreenMessage();
  });
}

function activateMode(mode, workingcycle) {
  switch (mode) {
    case STATUS.IDLE:
      displaying[2] = true;
      StartBells();
      break;
    case STATUS.FIRE:
      displaying = ["ALARM", "POZAR", false];
      fire(workingcycle);
      break;
    case STATUS.BARRICADE:
      displaying = ["ALARM", "BARYKADA", false];
      bell.writeSync(on);
      break;
  }
}
//Planer dzwonkow
function StartBells() {
  const workingcycle = cyklpracy;
  const planSetting = `plan.${weekday}`;
  getSetting(planSetting, (err, configuredMode) => {
    if (workingcycle !== cyklpracy) return;
    if (err || configuredMode === undefined) {
      console.error("Nie można odczytać planu dzwonków:", err || "brak rekordu");
      return;
    }
    getSetting('plan.override', (overrideErr, override) => {
      if (workingcycle !== cyklpracy) return;
      if (overrideErr) {
        console.error('Nie można odczytać tymczasowego planu:', overrideErr);
        override = null;
      }
      const today = localDateKey();
      let selectedMode = configuredMode;
      if (override && override.date === today && PLAN_OPTIONS[override.mode]) {
        selectedMode = override.mode;
      } else if (override !== null && override !== undefined) {
        setSetting('plan.override', null, clearErr => {
          if (clearErr) console.error('Nie można wyczyścić wygasłego planu:', clearErr);
        });
      }
      if (!['normalny', 'alternatywny_a', 'alternatywny_b', 'alternatywny_c', 'wylaczony'].includes(selectedMode)) {
        console.error('Nieznany tryb planu:', selectedMode);
        return;
      }
      currentPlanMode = selectedMode;
      ScreenMessage();
      if (selectedMode === 'wylaczony') return;
      db.all("SELECT lesson, brake FROM api_schedule WHERE option = ?", [selectedMode], (err, rows) => {
      if (workingcycle !== cyklpracy) return;
      if (err || !rows) {
        console.error("Nie można odczytać godzin dzwonków:", err || "brak wyników");
        return;
      }
      rows.forEach(b => {
        const [lh, lm] = String(b.lesson || '').split(':').map(Number);
        const [bh, bm] = String(b.brake || '').split(':').map(Number);
        const validTime = (hour, minute) => Number.isInteger(hour) && hour >= 0 && hour < 24
          && Number.isInteger(minute) && minute >= 0 && minute < 60;
        if (!validTime(lh, lm) || !validTime(bh, bm) || bh * 60 + bm <= lh * 60 + lm) {
          console.error("Pominięto nieprawidłowy wpis planu:", b);
          return;
        }
        const time = new Date();
        const lessonring = new Date(time.getFullYear(), time.getMonth(), time.getDate(), lh, lm, 0, 0);
        const brakering = new Date(time.getFullYear(), time.getMonth(), time.getDate(), bh, bm, 0, 0);
        if (lessonring.getTime() > Date.now()) bellhours.push([lessonring, true]);
        if (brakering.getTime() > Date.now()) bellhours.push([brakering, false]);
      });
      bellhours.sort((a, b) => a[0].getTime() - b[0].getTime());
      ScreenMessage();
      // Cykl Dzonienia
      function Schedule() {
        if (bellhours.length == 0 || workingcycle != cyklpracy) return;
          const delay = bellhours[0][0].getTime() - Date.now();
          setTimeout(() => {
            if (workingcycle != cyklpracy) return;
            bellhours.shift();
            ring(0, workingcycle);
            Schedule();
          },  delay);
          if (bellhours[0][1] && delay-60000 > 0) {
            setTimeout(() => {
              if (workingcycle != cyklpracy) return;
              ring(1, workingcycle);
            },  delay - 60000);
          }
        }
      Schedule();
      });
    });
  });
}
//Dzwonek
function ring(mode, workingcycle = cyklpracy) {
  getSetting(mode === 0 ? 'bell.normal' : 'bell.short', (err, durationValue) => {
    if (err || durationValue === undefined) {
      console.error("Nie można odczytać czasu dzwonka:", err || "brak rekordu");
      return;
    }
    const duration = Number(durationValue);
    if (workingcycle !== cyklpracy || !Number.isFinite(duration) || duration <= 0 || duration > 5) {
      if (duration > 5) console.error("Pominięto dzwonek: czas sygnału przekracza limit 5 sekund.");
      return;
    }
    const currentRing = ++ringVersion;
    bell.writeSync(on);
    setTimeout(() => {
      if (workingcycle === cyklpracy && currentRing === ringVersion
        && activeMode !== STATUS.FIRE && activeMode !== STATUS.BARRICADE) {
        bell.writeSync(off);
      }
    }, duration * 1000);
  });
}
//Alarm poz
function fire(workingcycle = cyklpracy) {
  getSetting('alarm.fire.signal_length', (lengthErr, signalLengthValue) => {
    if (workingcycle !== cyklpracy || activeMode !== STATUS.FIRE) return;
    if (lengthErr || signalLengthValue === undefined) {
      console.error("Nie można odczytać ustawień alarmu:", lengthErr || "brak rekordu");
      displaying = ["BLAD ALARMU", "BAZA DANYCH", false];
      ScreenMessage();
      return;
    }
    getSetting('alarm.fire.pulse_gap', (gapErr, pulseGapValue) => {
      if (gapErr || pulseGapValue === undefined) return console.error('Brak przerwy między sygnałami alarmu:', gapErr);
      getSetting('alarm.fire.cycle_gap', (cycleErr, cycleGapValue) => {
        if (cycleErr || cycleGapValue === undefined) return console.error('Brak przerwy między cyklami alarmu:', cycleErr);
    const signalLength = Number(signalLengthValue);
    const pulseGap = Number(pulseGapValue);
    const cycleGap = Number(cycleGapValue);
    if (![signalLength, pulseGap, cycleGap].every(Number.isFinite)
      || signalLength <= 0 || signalLength > 5 || pulseGap < 0 || pulseGap > 5 || cycleGap < 0 || cycleGap > 5) {
      console.error("Pominięto alarm: ustawienia muszą być z zakresu 0–5 s, a długość sygnału większa od zera.");
      bell.writeSync(off);
      displaying = ["BLAD ALARMU", "SPRAWDZ USTAW", false];
      ScreenMessage();
      return;
    }

    function pulse(index) {
      if (workingcycle !== cyklpracy || activeMode !== STATUS.FIRE) return;
      bell.writeSync(on);
      setTimeout(() => {
        if (workingcycle !== cyklpracy || activeMode !== STATUS.FIRE) return;
        bell.writeSync(off);
        if (index < 2) {
          setTimeout(() => pulse(index + 1), pulseGap * 1000);
        } else {
          setTimeout(() => pulse(0), cycleGap * 1000);
        }
      }, signalLength * 1000);
    }

    pulse(0);
      });
    });
  });
}
//Obsluga wyswietlacza
function ScreenMessage() {
  if (!displayInitialized) {
    lcd.beginSync();
    displayInitialized = true;
  }
  if (planMenuMode !== null && activeMode === STATUS.IDLE) {
    lcd.clearSync();
    lcd.printSync('Plan:');
    lcd.setCursorSync(0, 1);
    lcd.printSync(PLAN_OPTIONS[planMenuMode] || 'Normalny');
    return;
  }
  if (displaying[2]) {
    const now = new Date();
    displaying[0] = now.toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).replace(',', '');
    displaying[1] = 'DZWONEK:   ' + (bellhours.length > 0
      ? bellhours[0][0].toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      : 'BRAK');
  }
  lcd.clearSync();
  lcd.printSync(displaying[0]);
  lcd.setCursorSync(0, 1);
  lcd.printSync(displaying[1]);
}
//Sprawdzenie dnia
function todaycheck() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  if (days[now.getDay()] != weekday) {
    weekday = days[now.getDay()];
    Reload();
  }
}
//Cykl programu
function clock() {setTimeout(() => {ScreenMessage(); clock();}, (30 - (new Date().getSeconds() % 30)) * 1000); todaycheck();}
clock();
