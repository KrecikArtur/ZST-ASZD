const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const db = new sqlite3.Database(path.join(__dirname, '../backend/db.sqlite3'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/api/reload', (req, res) => {
  res.json({ success: true });
  Reload();
});

app.listen(80, () => {
  console.log(`Server is running.`);
});

//button presed buttonpressed(0);
//button presed buttonpressed(1);
//button presed buttonpressed(2);
//button presed buttonpressed(3);
let cyklpracy = 0;

function Reload() {
  //bell off
  if (cyklpracy > 10) { cyklpracy = 0;} else {cyklpracy += 1;}
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
      ScreenMessage(row.status)
      switch (row.status) {
        case 0:
          Schedule()
          console.log(0);
          break;
        case 1:
          ring(0);
          db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [0],);
        break;
        case 2:
          fire()
        break;
        case 3:
          console.log(3);
          //bell on
        break;
    }
  });
}

function buttonpressed(button) {
  db.get("SELECT status FROM api_belldata LIMIT 1", [], (err, row) => {
    if (row.status == 0 || button == 0) { db.run("UPDATE api_belldata SET status = ? WHERE id = 1", [button],); Reload(); }
  });
}

function ring(mode) {
  db.get("SELECT bells FROM api_belldata LIMIT 1", [], (err, row) => {
    const time = JSON.parse(row.bells);
    //bell on
    setTimeout (() => {
      //bell off
      Reload();
    }, time[mode]*1000);
    console.log(1);
  });
}

function fire() {
  db.get("SELECT fire FROM api_belldata LIMIT 1", [], (err, row) => {
    const time = JSON.parse(row.fire);
    const working = cyklpracy;
    function cykl() {
      if (working!=cyklpracy) return;
      //bell on
      setTimeout(() => {
        //bell off
        setTimeout(() => {
          //bell on
          setTimeout(() => {
            //bell off
            setTimeout(() => {
              //bell on
              setTimeout(() => {
                //bell off
                setTimeout(cykl, time[2] * 1000);
              }, time[1] * 1000);
            }, time[2] * 1000);
          }, time[1] * 1000);
        }, time[2] * 1000);
      }, time[1] * 1000);
    }
    cykl();
  });
}

function Schedule() { // Dokończyć
  //const d = new Date();
  db.get("SELECT shedule FROM api_schedule LIMIT 1", [], (err, row) => {
    
  });
} // Dokończyć

function ScreenMessage(mode) {
    switch (mode) {
      case 0:
        //Screen normal
        break;
      case 2:
        //Screen FIRE! FIRE!
        break;
      case 3:
        //Screen barykadować się! debil ze spluwą!
        break;
    }
    //jakaś powtarzalność co 30 sekund
}


//const Gpio = require('onoff').Gpio;

//const bell = new Gpio(529, 'out');
//const ringb = new Gpio(539, 'in', 'rising');
//const alarm1b = new Gpio(535, 'in', 'rising');
//const alarm2b = new Gpio(536, 'in', 'rising');
//const cancelb = new Gpio(534, 'in', 'rising');




//const LCDSCREEN = require('raspberrypi-liquid-crystal');
//const LCD = new LCDSCREEN( 1, 0x27, 16, 2 );

//const low = 0;
//const high = 1;

//lcd.beginSync();
//function display() {
//    const now = new Date();
//    const time = now.toLocaleString('en-GB', {year: 'numeric',month: '2-digit',day: '2-digit',hour: '2-digit',minute: '2-digit',hour12: false }).replace(',', '');
//    let next;
//    if (schedule.length>0) {
//        const date = new Date(schedule[0]*1000);
//        next = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
//    } else { next = `Brak`; }
//    if (isdisplay) {
//        lcd.clearSync();
//        lcd.printSync(time);
//        lcd.setCursorSync(0, 1);
//        lcd.printSync(`Next: ${next}`);
//    }
//}