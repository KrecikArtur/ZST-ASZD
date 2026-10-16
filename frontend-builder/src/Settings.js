import React, { useState, useEffect } from "react";
import Sidebar from './components/Sidebar';
import { Spinner, Row, Col, Form, Button } from "react-bootstrap";
import { showToast } from './components/Toaster';
import { UseData, frontPing } from "./components/Login-Sys";

const Settings = () => {
  const [bellNormal, setBellNormal] = useState(0);
  const [bellShort, setBellShort] = useState(0);
  const [fireLength, setFireLength] = useState(0);
  const [fireGap, setFireGap] = useState(0);
  const [fireGap2, setFireGap2] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadValues = async () => {
    try {
      const rows = await UseData('get', 'belldata/');
      const values = Object.fromEntries(rows.map(({ setting, value }) => [setting, value]));
      setBellNormal(values['bell.normal'] ?? 0);
      setBellShort(values['bell.short'] ?? 0);
      setFireLength(values['alarm.fire.signal_length'] ?? 0);
      setFireGap(values['alarm.fire.pulse_gap'] ?? 0);
      setFireGap2(values['alarm.fire.cycle_gap'] ?? 0);
    } catch (err) {
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValues();
  }, []);

  const saveAll = async () => {
    try {
      await Promise.all([
        ['bell.normal', bellNormal],
        ['bell.short', bellShort],
        ['alarm.fire.signal_length', fireLength],
        ['alarm.fire.pulse_gap', fireGap],
        ['alarm.fire.cycle_gap', fireGap2],
      ].map(([setting, value]) => UseData('patch', `belldata/${setting}`, { value })));
      showToast("Zapisano ustawienia.", "success");
      await frontPing('bell/reload', {});
    } catch (err) {
      console.error("Save error:", err);
      showToast("Błąd podczas zapisu!", "danger");
    }
  };

  const renderSlider = (label, value, setValue) => (
    <Form.Group className="mb-4">
      <Form.Label className="text-primary">
        {label}: <strong className="text-primary">{value}s</strong>
      </Form.Label>
      <Form.Range
        min={0}
        max={5}
        step={0.25}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
      />
    </Form.Group>
  );
  
  return (
    <Sidebar>
    <div className='text-center'>
      <h1 className='text-primary'>Ustawienia</h1>
      <hr/>
      <div className="p-4 rounded border border-primary-subtle bg-primary-subtle">
        {!loading ? (<>
          <Row className="p-2 rounded border border-primary-subtle bg-secondary-subtle">
            <h4 className="mb-3 text-primary ">Dzwonki</h4>
            <Col md={6}>{renderSlider("Normalny", bellNormal, setBellNormal)}</Col>
            <Col md={6}>{renderSlider("Krótki", bellShort, setBellShort)}</Col>
          </Row>

          <Row className="p-2 mt-4 rounded border border-primary-subtle bg-secondary-subtle">
            <h4 className="mb-3 text-primary">Alarm Pożarowy</h4>
            <Col md={4}>{renderSlider("Długość sygnału", fireLength, setFireLength)}</Col>
            <Col md={4}>{renderSlider("Przerwa między sygnałami", fireGap, setFireGap)}</Col>
            <Col md={4}>{renderSlider("Przerwa między cyklami", fireGap2, setFireGap2)}</Col>
          </Row>
          <Row className="mt-4">
            <Col md={6}>
              <Button
                className="mt-3 w-100 bg-secondary-subtle border border-danger text-danger"
                onClick={loadValues}
              >Reset</Button>
            </Col>
            <Col md={6}>
              <Button
                className="mt-3 w-100 bg-secondary-subtle border border-success text-success"
                onClick={saveAll}
              >Zapisz</Button>
            </Col>
          </Row>
        </>):(<Spinner animation="border" variant="primary" role="status" />)}
      </div>
    </div>
  </Sidebar>
  );
}
export default Settings;
