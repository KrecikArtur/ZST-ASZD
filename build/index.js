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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/bell/reload', (req, res) => {
  res.json({ success: true });
  Reload();
});
app.listen(3000, () => {
  console.log(`Aktywacja Systemu: ${new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}`);
});

let cyklpracy = 0;
let weekday = '';
let bellhours = [];
let displaying = 0;

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
          StartBells();
          break;
        case 1:
          ring(0);
          db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [0],);
          Reload();
        break;
        case 2:
          fire();
        break;
        case 3:
          bell.writeSync(on);
        break;
    }
    displaying = row.status;
    ScreenMessage(displaying);
  });
} // Przeladowanie stanu programu

function buttonpressed(button) {
  const modes = ["ANULUJ","DZWONEK","ALARM POZAROWY","ALARM BARYKADA"];
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
    const workingcycle = cyklpracy;
    if (displaying==modes[button]) {
      if (row.status == 0 || button == 0) { db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [button],); Reload(); }
    } else {
      displaying = modes[button];
      ScreenMessage(displaying);
      setTimeout(() => {
        if (workingcycle != cyklpracy||displaying!=modes[button]) {return}
          db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => { displaying = row.status; ScreenMessage(displaying); })
      }, 5000);
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
    db.all("SELECT hour, prebell FROM api_schedule WHERE option = ?", [row[weekday]], (err, rows) => {
      const workingcycle = cyklpracy;
      rows.forEach(b => {
        const time = new Date();
        const [h, m] = b.hour.split(':').map(Number);
        const ringtime = new Date(time.getFullYear(), time.getMonth(), time.getDate(), h, m, 0, 0);
        if (ringtime.getTime() > Date.now()) bellhours.push([ringtime, b.prebell]);
      });
      function Schedule() {
        if (bellhours.length == 0 || workingcycle != cyklpracy) return;
          const delay = bellhours[0][0].getTime() - Date.now();
          setTimeout(() => {
            if (workingcycle != cyklpracy) return;
            bellhours.shift();
            ring(0,workingcycle);
            Schedule();
          },  delay);
          if (bellhours[0][1] && delay - 60000 > 0) {
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

  function ScreenMessage(mode) {
    switch (mode) {
      case 0:
        const now = new Date();
        const time = now.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).replace(',', '');
        const next = bellhours.length > 0 ? bellhours[0][0].toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }): "BRAK";
        display(time, "DZWONEK:   " + next);
        break;
      case 1:
        break;
      case 2:
        display("     ALARM!", "    POZAROWY");
        break;
      case 3:
        display("     ALARM!", "    BARYKADA");
        break;
      default:
        display(mode, "WYKONAC?");
        break;
    } // wyswietlanie wiadomosci 
  function display(line1, line2) {
    lcd.clearSync();
    lcd.printSync(line1);
    lcd.setCursorSync(0, 1);
    lcd.printSync(line2);
  }
} // Obsluga wyswietlacza LCD

setTimeout(() => {
      setInterval(() => {
        ScreenMessage(displaying);
      }, 60000);
      ScreenMessage(displaying);
  }, 60000 - new Date().getSeconds() * 1000); //Cykl wyswietlacza

function todaycheck() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  if (days[now.getDay()] != weekday) {
    weekday = days[now.getDay()];
    Reload();
  }
}
setInterval(todaycheck, 300000);
todaycheck();