const on = 0;
const off = 1;
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const Gpio = require('onoff').Gpio;
const bell = new Gpio(529, 'out');
bell.writeSync(off);
const LCDSCREEN = require('raspberrypi-liquid-crystal');
const lcd = new LCDSCREEN( 1, 0x27, 16, 2 );
lcd.beginSync();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const db = new sqlite3.Database(path.join(__dirname, '../backend/db.sqlite3'));
app.get(/.*/, (req, res) => {res.sendFile(path.join(__dirname, 'public', 'index.html'));});
app.post('/bell/reload', (req, res) => {
  res.json({ success: true });
  Reload();
});
app.listen(3010, () => {
  console.log(`Aktywacja Systemu: ${new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}`);
});

let cyklpracy = 0;
let weekday = '';
let bellhours = [];
let displaying = ["",""];

new Gpio(534, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(0);});
new Gpio(539, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(1);});
new Gpio(535, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(2);});
new Gpio(536, 'in', 'both').watch((err, value) => {if (value === 1) buttonpressed(3);});

function Reload() {
  bell.writeSync(off);
  bellhours = [];
  if (cyklpracy > 10) { cyklpracy = 0;} else {cyklpracy += 1;}
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
      switch (row.status) {
        case 0:
          displaying = ["",""]
          StartBells();
          break;
        case 1:
          ring(0);
          db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [0],);
          Reload();
        break;
        case 2:
          displaying = ["ALARM","POZAR"]
          fire();
        break;
        case 3:
          displaying = ["ALARM","BARYKADA"]
          bell.writeSync(on);
        break;
    }
    ScreenMessage();
  });
} // Przeladowanie stanu programu

function buttonpressed(button) {
  const modes = ["ANULUJ","ZADZWON","ALARM POZAROWY","ALARM BARYKADA"];
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
    const workingcycle = cyklpracy;
    if (displaying[0]==modes[button]) {
      if (row.status == 0 || button == 0) { db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [button],); Reload(); }
    } else {
      setTimeout(() => {
        displaying = [modes[button],"WYKONAC?"];
        ScreenMessage();
        setTimeout(() => {
          if (workingcycle!=cyklpracy||displaying[0]!=modes[button]) {return}
          displaying = ["",""]; ScreenMessage();
        }, 5000);
      },500)
    }
  });
} // Obsluga przyciskow

function ring(mode) {
  db.get("SELECT bells FROM api_belldata LIMIT 1", [], (err, row) => {
    const time = JSON.parse(row.bells);
    bell.writeSync(on);
    setTimeout (() => {
      bell.writeSync(off);
    }, time[mode]*1000);
  });
} // Dzwonek

function fire() {
  db.get("SELECT fire FROM api_belldata LIMIT 1", [], (err, row) => {
    const time = JSON.parse(row.fire);
    const workingcycle = cyklpracy;
    function cykl() {
      if (workingcycle != cyklpracy) return;
      bell.writeSync(on);
      setTimeout(() => {
        bell.writeSync(off);
        setTimeout(() => {
          bell.writeSync(on);
          setTimeout(() => {
            bell.writeSync(off);
            setTimeout(() => {
              bell.writeSync(on);
              setTimeout(() => {
                bell.writeSync(off);
                setTimeout(cykl, time[2] * 1000);
              }, time[1] * 1000);
            }, time[0] * 1000);
          }, time[1] * 1000);
        }, time[0] * 1000);
      }, time[1] * 1000);
    }
    cykl();
  });
} // Alarm pozarowy

function StartBells() {
  db.get(`SELECT ${weekday} FROM api_belldata LIMIT 1`, [], (err, row) => {
    db.all("SELECT lesson, brake FROM api_schedule WHERE option = ?", [row[weekday]], (err, rows) => {
      const workingcycle = cyklpracy;
      rows.forEach(b => {
        const [lh, lm] = b.lesson.split(':').map(Number);
        const [bh, bm] = b.brake.split(':').map(Number);
        const time = new Date();
        const lessonring = new Date(time.getFullYear(), time.getMonth(), time.getDate(), lh, lm, 0, 0);
        const brakering = new Date(time.getFullYear(), time.getMonth(), time.getDate(), bh, bm, 0, 0);
        if (lessonring.getTime() > Date.now()) bellhours.push([lessonring, true]);
        if (brakering.getTime() > Date.now()) bellhours.push([brakering, false]);
      });
      ScreenMessage();
      function Schedule() {
        if (bellhours.length == 0 || workingcycle != cyklpracy) return;
          const delay = bellhours[0][0].getTime() - Date.now();
          setTimeout(() => {
            if (workingcycle != cyklpracy) return;
            bellhours.shift();
            ring(0);
            Schedule();
          },  delay);
          if (bellhours[0][1] && delay-60000 > 0) {
            setTimeout(() => {
              if (workingcycle != cyklpracy) return;
              ring(1);
            },  delay - 60000);
          }
        } // Cykl Dzonienia
      Schedule();
    });
  });
} // Start dzwonkow

function ScreenMessage() {
  lcd.clearSync();
  if (displaying[0]=="") {
    const now = new Date();
    const time = now.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).replace(',', '');
    const next = bellhours.length > 0 ? bellhours[0][0].toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }): "BRAK";
    lcd.printSync(time);
    lcd.setCursorSync(0, 1);
    lcd.printSync("DZWONEK:   " + next);
  } else {
    lcd.printSync(displaying[0]);
    lcd.setCursorSync(0, 1);
    lcd.printSync(displaying[1]);
  }
} // Obsluga wyswietlacza LCD

function clock() {setTimeout(() => {ScreenMessage(); clock()}, (30 - (new Date().getSeconds() % 30)) * 1000);} //Cykl wyswietlacza

function todaycheck() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  if (days[now.getDay()] != weekday) {
    weekday = days[now.getDay()];
    Reload();
  }
}// sprawdz co dzisiaj
setInterval(todaycheck, 180000); //sprawdzaj co 30 minut
clock();
todaycheck();
