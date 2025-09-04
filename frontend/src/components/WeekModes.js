import React, { useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { showToast } from './Toaster';
import axios from 'axios';
const apiBase = `http://${window.location.hostname}:8080`;

const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const LABELS = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
};

const LAYOUT = [
  DAYS.slice(0, 2),
  DAYS.slice(2, 5),
  DAYS.slice(5, 7)
];

const OPTIONS = [
  { value: 'norm', label: 'Standardowy' },
  { value: 'dsbl', label: 'Wyłączony' },
  { value: 'alta', label: 'Alt. A' },
  { value: 'altb', label: 'Alt. B' },
  { value: 'altc', label: 'Alt. C' },
];

const modeClass = {
  norm: 'border-success-subtle text-success',
  dsbl: 'border-danger-subtle text-danger',
  alta: 'border-info-subtle text-info',
  altb: 'border-info-subtle text-info',
  altc: 'border-info-subtle text-info',
};

const DaySelector = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${apiBase}/api/belldata/1/`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd ładowania danych:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (dayKey, value) => {
    setData(prev => ({ ...prev, [dayKey]: value }));
    axios.patch(`${apiBase}/api/belldata/1/`, {
      [dayKey]: value,
    })
    .then(() => {
      showToast("Tryb dzwonienia zaktualizowany!", "success")
      fetch('/api/reload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      })
    })
  };

  if (loading || !data) return <Spinner className={"spinner-border text-primary"} />;

  return (
    <div className="bg-secondary-subtle border border-primary-subtle p-4 rounded">
      {LAYOUT.map((row, rowIndex) => (
        <div className="d-flex justify-content-center gap-2 mb-2" key={rowIndex}>
          {row.map(dayKey => {
            const mode = data[dayKey];
            return (
              <div
                key={dayKey}
                className={`border p-4 rounded text-center ${modeClass[mode] || ''}`}
              >
                <Form.Label className="fs-4">{LABELS[dayKey]}</Form.Label>
                <Form.Select
                  className={`text-center bg-dark border ${modeClass[mode] || ''}`}
                  value={mode || ''}
                  onChange={(e) => handleChange(dayKey, e.target.value)}
                >
                  {OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default DaySelector;
