import React, { useState, useEffect } from "react";
import Sidebar from './components/Sidebar';
import { Spinner, Row, Col, Form, Button } from "react-bootstrap";
import { showToast } from './components/Toaster';
import { getData, saveData, frontPing } from "./components/Login-Sys";

const Settings = () => {
  const [bellNormal, setBellNormal] = useState(0);
  const [bellShort, setBellShort] = useState(0);
  const [fireLength, setFireLength] = useState(0);
  const [fireGap, setFireGap] = useState(0);
  const [fireGap2, setFireGap2] = useState(0);

  const loadValues = async () => {
    try {
      const data = await getData('belldata/1/');
      if (Array.isArray(data.bells)) {
        setBellNormal(data.bells[0] ?? 0);
        setBellShort(data.bells[1] ?? 0);
      }
      if (Array.isArray(data.fire)) {
        setFireLength(data.fire[0] ?? 0);
        setFireGap(data.fire[1] ?? 0);
        setFireGap2(data.fire[2] ?? 0);
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  useEffect(() => {
    loadValues();
  }, []);

  const saveAll = async () => {
    try {
      await saveData('belldata/1', {
        bells: [bellNormal, bellShort],
        fire: [fireLength, fireGap, fireGap2],
      });
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
        {fireGap2 ? (<>
          <Row className="p-2 rounded border border-primary-subtle bg-secondary-subtle">
            <h4 className="mb-3 text-primary ">Długość Dzwonków</h4>
            <Col md={6}>{renderSlider("Normalny", bellNormal, setBellNormal)}</Col>
            <Col md={6}>{renderSlider("Krótki", bellShort, setBellShort)}</Col>
          </Row>

          <Row className="p-2 mt-4 rounded border border-primary-subtle bg-secondary-subtle">
            <h4 className="mb-3 text-primary">Alarm Pożarowy</h4>
            <Col md={4}>{renderSlider("Długość sygnału", fireLength, setFireLength)}</Col>
            <Col md={4}>{renderSlider("Przerwa w cyklu", fireGap, setFireGap)}</Col>
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
