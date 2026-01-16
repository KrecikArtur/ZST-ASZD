import React, { useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { showToast } from './Toaster';
import { getData, saveData, frontPing } from "./Login-Sys";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

const ModeSelector = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await getData('belldata/1/');
        setData(res);
      } catch (err) {
        console.error('Błąd ładowania danych:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = async (day, value) => {
    setData(prev => ({ ...prev, [day]: value }));
    try {
      await saveData('belldata/1', { [day]: value });
      showToast("Tryb dzwonienia zaktualizowany!", "success");
      await frontPing('bell/reload', {});
    } catch (err) {
      console.error('Błąd aktualizacji:', err);
      showToast('Błąd podczas zapisu!', 'danger');
    }
  };

  return loading ? (<Spinner className="spinner-border text-primary" />):(<>
    <div className="bg-primary-subtle border border-primary-subtle p-4 rounded">
      {LAYOUT.map((row, rowIndex) => (
        <div className="d-flex justify-content-center gap-2 mb-2" key={rowIndex}>
          {row.map(day => (
            <div
              key={day}
              className={`border p-4 rounded text-center bg-secondary-subtle ${modeClass[data[day]] || ''}`}
            >
              <Form.Label className="fs-4">{LABELS[day]}</Form.Label>
              <Form.Select
                className={`text-center bg-dark border ${modeClass[data[day]] || ''}`}
                value={data[day] || ''}
                onChange={e => handleChange(day, e.target.value)}
              >
                {OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </div>
          ))}
        </div>
      ))}
    </div>
  </>);
}
export default ModeSelector;
