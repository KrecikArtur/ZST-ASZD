//Rozruch wyswietlacza
const LCDSCREEN = require('raspberrypi-liquid-crystal');
const lcd = new LCDSCREEN( 1, 0x27, 16, 2 );
lcd.beginSync();
lcd.clearSync();
lcd.printSync(" Wczytywanie... ");
//Wczytanie bazy danych
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, '../backend/db.sqlite3'));
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
app.listen(3010, () => {
  console.log(`Aktywacja Systemu: ${new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`);
});
//Zmienne!
const on = 1;
const off = 0;
let cyklpracy = 0;
let ringVersion = 0;
let activeMode = 0;
let manualBellPendingUntil = 0;
let initialModeLoaded = false;
const lastButtonPress = new Map();
let weekday = '';
let bellhours = [];
let displaying = ["","",true];
//Obsluga przyciskow
const Gpio = require('onoff').Gpio;
const bell = new Gpio(529, 'out');
bell.writeSync(off);
new Gpio(534, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(0);});
new Gpio(539, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(1);});
new Gpio(535, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(2);});
new Gpio(536, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(3);});
function buttonpressed(button) {
  const now = Date.now();
  if (now - (lastButtonPress.get(button) || 0) < 300) return;
  lastButtonPress.set(button, now);
  const workingcycle = cyklpracy;
  const modes = ["ANULUJ","ZADZWON","ALARM POZAROWY","ALARM BARYKADA"];
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
    if (workingcycle !== cyklpracy) return;
    if (err || !row) {
      console.error("Nie można odczytać stanu dzwonka:", err || "brak rekordu");
      return;
    }
    if (displaying[0] === modes[button]) {
      if (Number(row.status) === 0 || button === 0) {
        db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [button], err => {
          if (err) {
            console.error("Nie można zmienić stanu dzwonka:", err);
            return;
          }
          Reload();
        });
      }
    } else {
      setTimeout(() => {
        if (workingcycle !== cyklpracy) return;
        displaying = [modes[button],"WYKONAC?",false];
        ScreenMessage();
        setTimeout(() => {
          if (workingcycle!=cyklpracy||displaying[0]!=modes[button]) {return}
          displaying[2] = true; ScreenMessage();
        }, 5000);
      },500)
    }
  });
}
//Przeladowanie stanu programu
function Reload() {
  bell.writeSync(off);
  bellhours = [];
  cyklpracy += 1;
  ringVersion += 1;
  const workingcycle = cyklpracy;
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
    if (workingcycle !== cyklpracy) return;
    if (err || !row) {
      activeMode = 0;
      displaying = ["BLAD", "BAZA DANYCH", false];
      console.error("Nie można odczytać stanu dzwonka:", err || "brak rekordu");
      ScreenMessage();
      return;
    }

    let requestedMode = Number(row.status);
    if (!initialModeLoaded) {
      initialModeLoaded = true;
      if (requestedMode === 1) {
        // A one-shot ring left behind by a crash must not ring again on reboot.
        requestedMode = 0;
        db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [0], updateErr => {
          if (updateErr) console.error("Nie można wyczyścić starego polecenia dzwonka:", updateErr);
        });
      }
    }
    if (![0, 1, 2, 3].includes(requestedMode)) {
      activeMode = 0;
      displaying = ["BLAD", "NIEZNANY TRYB", false];
      console.error("Nieznany stan dzwonka:", row.status);
      ScreenMessage();
      return;
    }

    // Zwykły dzwonek nie może przerwać aktywnego alarmu ani go przełączyć.
    if (activeMode !== 0 && requestedMode !== 0 && requestedMode !== activeMode) {
      db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [activeMode], updateErr => {
        if (updateErr) console.error("Nie można przywrócić aktywnego alarmu:", updateErr);
      });
      activateMode(activeMode, workingcycle);
      ScreenMessage();
      return;
    }

    if (requestedMode === 1) {
      if (activeMode !== 0 || Date.now() < manualBellPendingUntil) {
        db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [activeMode]);
        activateMode(activeMode, workingcycle);
        ScreenMessage();
        return;
      }
      manualBellPendingUntil = Date.now() + 5000;
      activeMode = 0;
      displaying[2] = true;
      ring(0, workingcycle);
      db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [0], updateErr => {
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
    case 0:
      displaying[2] = true;
      StartBells();
      break;
    case 2:
      displaying = ["ALARM", "POZAR", false];
      fire(workingcycle);
      break;
    case 3:
      displaying = ["ALARM", "BARYKADA", false];
      bell.writeSync(on);
      break;
  }
}
//Planer dzwonkow
function StartBells() {
  const workingcycle = cyklpracy;
  db.get(`SELECT ${weekday} FROM api_belldata LIMIT 1`, [], (err, row) => {
    if (workingcycle !== cyklpracy) return;
    if (err || !row) {
      console.error("Nie można odczytać planu dzwonków:", err || "brak rekordu");
      return;
    }
    db.all("SELECT lesson, brake FROM api_schedule WHERE option = ?", [row[weekday]], (err, rows) => {
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
}
//Dzwonek
function ring(mode, workingcycle = cyklpracy) {
  db.get("SELECT bells FROM api_belldata LIMIT 1", [], (err, row) => {
    if (err || !row) {
      console.error("Nie można odczytać czasu dzwonka:", err || "brak rekordu");
      return;
    }
    let times;
    try {
      times = typeof row.bells === "string" ? JSON.parse(row.bells) : row.bells;
    } catch (parseError) {
      console.error("Nieprawidłowe ustawienia dzwonka:", parseError);
      return;
    }
    const duration = Number(times?.[mode]);
    if (workingcycle !== cyklpracy || !Number.isFinite(duration) || duration <= 0 || duration > 5) {
      if (duration > 5) console.error("Pominięto dzwonek: czas sygnału przekracza limit 5 sekund.");
      return;
    }
    const currentRing = ++ringVersion;
    bell.writeSync(on);
    setTimeout(() => {
      if (workingcycle === cyklpracy && currentRing === ringVersion && activeMode !== 2 && activeMode !== 3) {
        bell.writeSync(off);
      }
    }, duration * 1000);
  });
}
//Alarm poz
function fire(workingcycle = cyklpracy) {
  db.get("SELECT fire FROM api_belldata LIMIT 1", [], (err, row) => {
    if (workingcycle !== cyklpracy || activeMode !== 2) return;
    if (err || !row) {
      console.error("Nie można odczytać ustawień alarmu:", err || "brak rekordu");
      displaying = ["BLAD ALARMU", "BAZA DANYCH", false];
      ScreenMessage();
      return;
    }
    let times;
    try {
      times = typeof row.fire === "string" ? JSON.parse(row.fire) : row.fire;
    } catch (parseError) {
      console.error("Nieprawidłowe ustawienia alarmu:", parseError);
      displaying = ["BLAD ALARMU", "USTAWIENIA", false];
      ScreenMessage();
      return;
    }

    const [signalLength, pulseGap, cycleGap] = Array.isArray(times) ? times.map(Number) : [];
    if (![signalLength, pulseGap, cycleGap].every(Number.isFinite)
      || signalLength <= 0 || signalLength > 5 || pulseGap < 0 || pulseGap > 5 || cycleGap < 0 || cycleGap > 5) {
      console.error("Pominięto alarm: ustawienia muszą być z zakresu 0–5 s, a długość sygnału większa od zera.");
      bell.writeSync(off);
      displaying = ["BLAD ALARMU", "SPRAWDZ USTAW", false];
      ScreenMessage();
      return;
    }

    function pulse(index) {
      if (workingcycle !== cyklpracy || activeMode !== 2) return;
      bell.writeSync(on);
      setTimeout(() => {
        if (workingcycle !== cyklpracy || activeMode !== 2) return;
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
}
//Obsluga wyswietlacza
function ScreenMessage() {
  if (displaying[2]) {
    const now = new Date();
    displaying[0] = now.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).replace(',', '');
    displaying[1] = "DZWONEK:   "+(bellhours.length > 0 ? bellhours[0][0].toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }): "BRAK");
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
