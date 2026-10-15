import React, { useEffect, useState } from 'react';
import { Table, Modal } from 'react-bootstrap';

function Calendar({ dane = [], currentDate }) {
  const [calendarRows, setCalendarRows] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const themes = [
    { name: "Niebieski", class: "bg-primary-subtle text-primary-emphasis border-primary" },
    { name: "Zielony", class: "bg-success-subtle text-success-emphasis border-success" },
    { name: "Żółty", class: "bg-warning-subtle text-warning-emphasis border-warning" },
    { name: "Czerwony", class: "bg-danger-subtle text-danger-emphasis border-danger" },
    { name: "Morski", class: "bg-info-subtle text-info-emphasis border-info" },
    { name: "Czarny", class: "bg-dark-subtle text-dark-emphasis border-dark" },
    { name: "Biały", class: "bg-light-subtle text-light-emphasis border-light" }
  ];
  const formatDateString = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };
  const formatEventRangeParts = (stimeISO, etimeISO) => {
    if (!stimeISO) return { dateStr: '', timeStr: '' };
    const [startDateRaw, startTimeRaw] = stimeISO.split('T');
    const [endDateRaw, endTimeRaw] = (etimeISO || stimeISO).split('T');
    const startDateFormatted = formatDateOnly(startDateRaw);
    const endDateFormatted = formatDateOnly(endDateRaw);
    const startTimeFormatted = startTimeRaw ? startTimeRaw.slice(0, 5) : '';
    const endTimeFormatted = endTimeRaw ? endTimeRaw.slice(0, 5) : '';
    const showStartTime = startTimeFormatted && startTimeFormatted !== '00:00';
    const showEndTime = endTimeFormatted && endTimeFormatted !== '23:59';
    if (startDateRaw === endDateRaw) {
      let timeStr = '';
      if (showStartTime && showEndTime) {
        timeStr = `od ${startTimeFormatted} -> do ${endTimeFormatted}`;
      } else if (showStartTime && !showEndTime) {
        timeStr = `od ${startTimeFormatted}`;
      } else if (!showStartTime && showEndTime) {
        timeStr = `do ${endTimeFormatted}`;
      }

      return {
        dateStr: startDateFormatted,
        timeStr: timeStr
      };
    }

    const dateStr = `${startDateFormatted} –> ${endDateFormatted}`;
    let timeStr = '';
    if (showStartTime && showEndTime) {
      timeStr = `od ${startTimeFormatted} –> do ${endTimeFormatted}`;
    } else if (showStartTime) {
      timeStr = `od ${startTimeFormatted}`;
    } else if (showEndTime) {
      timeStr = `do ${endTimeFormatted}`;
    }

    return { dateStr, timeStr };
  };

  useEffect(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const daysArray = [];

    const getEventsForDay = (d, m, y) => {
      const targetDateObj = new Date(y, m, d);
      const targetStr = formatDateString(targetDateObj);

      return dane.filter(event => {
        if (!event.stime) return false;
        
        const startStr = event.stime.slice(0, 10);
        const endStr = event.etime ? event.etime.slice(0, 10) : startStr;

        return targetStr >= startStr && targetStr <= endStr;
      });
    };

    const createDayObject = (dayValue, isCurrent, indexInWeek, currentM, currentY) => {
      const dayEvents = getEventsForDay(dayValue, currentM, currentY);
      return {
        day: dayValue,
        isCurrentMonth: isCurrent,
        isWeekend: indexInWeek === 5 || indexInWeek === 6,
        hasEvent: dayEvents.length > 0,
        events: dayEvents
      };
    };

    const prevM = month - 1 === -1 ? 11 : month - 1;
    const prevY = month - 1 === -1 ? year - 1 : year;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayValue = daysInPrevMonth - i;
      const indexInWeek = startDayOfWeek - 1 - i; 
      daysArray.push(createDayObject(dayValue, false, indexInWeek, prevM, prevY));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const indexInWeek = (startDayOfWeek + i - 1) % 7;
      daysArray.push(createDayObject(i, true, indexInWeek, month, year));
    }

    const nextM = month + 1 === 12 ? 0 : month + 1;
    const nextY = month + 1 === 12 ? year + 1 : year;
    const totalSlots = Math.ceil(daysArray.length / 7) * 7;
    const nextMonthDaysNeeded = totalSlots - daysArray.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      const indexInWeek = (daysArray.length) % 7;
      daysArray.push(createDayObject(i, false, indexInWeek, nextM, nextY));
    }

    const rows = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      rows.push(daysArray.slice(i, i + 7));
    }
    setCalendarRows(rows);
  }, [currentDate, year, month, dane]);

  return (
    <div>
      <Table bordered className="border-success-subtle align-top m-0 w-100" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="table-dark text-success border-success col">Pn</th>
            <th className="table-dark text-success border-success col">Wt</th>
            <th className="table-dark text-success border-success col">Śr</th>
            <th className="table-dark text-success border-success col">Cz</th>
            <th className="table-dark text-success border-success col">Pt</th>
            <th className="table-dark text-danger border-success col">Sb</th>
            <th className="table-dark text-danger border-success col">Nd</th>
          </tr>
        </thead>
        <tbody>
          {calendarRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => {
                let textcolor = "";
                let bgcolor = "bg-secondary-subtle";

                if (cell.isWeekend) {
                  textcolor = "text-danger";
                }
                if (!cell.isCurrentMonth) {
                  bgcolor = "bg-body-tertiary text-muted";
                } else {
                  const dzis = new Date();
                  if (cell.day === dzis.getDate() && month === dzis.getMonth() && year === dzis.getFullYear()) {
                    textcolor = "text-info";
                    bgcolor = "bg-info-subtle";
                  }
                }

                return (
                  <td 
                    key={cellIndex} 
                    className={`${bgcolor} p-1 align-top`}
                  >
                    <div className="pb-5">
                      <div className={`fw-bold text-start ps-1 ${textcolor} small`}>
                        {cell.day}
                      </div>
                      <div className="d-flex flex-column gap-1 mt-1">
                        {cell.events.map((e, index) => {
                          const colorIndex = e.color !== undefined ? Number(e.color) % themes.length : 0;
                          const themeClasses = themes[colorIndex].class;

                          return (
                            <div
                              key={index}
                              className={`${themeClasses} border-start border-4 rounded-end text-start px-2 py-0 small text-truncate lh-sm`}
                              style={{ cursor: 'pointer' }}
                              title={e.description}
                              onClick={() => setSelectedEvent(e)}
                            >
                              {e.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal 
        show={!!selectedEvent} 
        onHide={() => setSelectedEvent(null)} 
        centered
      >
        {selectedEvent && (() => {
          const colorIndex = selectedEvent.color !== undefined ? Number(selectedEvent.color) % themes.length : 0;
          const themeClasses = themes[colorIndex].class;
          const { dateStr, timeStr } = formatEventRangeParts(selectedEvent.stime, selectedEvent.etime);

          return (
            <>
              <Modal.Header className="bg-secondary-subtle border-success-subtle">
                <Modal.Title className="w-100">
                  <div className={`${themeClasses} border-start border-4 rounded-end p-2 fs-5 fw-bold text-start`}>
                    {selectedEvent.name}
                  </div>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="bg-secondary-subtle text-start">
                <div className="mb-3">
                  <strong className="text-success-emphasis">Termin:</strong>
                  <div className="mt-1 ms-1">
                    <div>{dateStr}</div>
                    {timeStr && <div className="text-muted">{timeStr}</div>}
                  </div>
                </div>

                <div>
                  <strong className="text-success-emphasis">Opis:</strong>
                  <p className="mb-0 mt-1 bg-light-subtle p-2 rounded border border-secondary-subtle" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedEvent.description || "Brak opisu."}
                  </p>
                </div>
              </Modal.Body>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

export default Calendar;