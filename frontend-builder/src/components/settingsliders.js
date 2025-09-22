// Sliders.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { showToast } from './Toaster';
import axios from "axios";

const apiBase = `http://${window.location.hostname}/api`;

const Sliders = () => {
  const [bellNormal, setBellNormal] = useState(0);
  const [bellShort, setBellShort] = useState(0);
  const [fireLength, setFireLength] = useState(0);
  const [fireGap, setFireGap] = useState(0);
  const [fireGap2, setFireGap2] = useState(0);

  const loadValues = () => {
    axios
      .get(`${apiBase}/belldata/1/`)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data.bells)) {
          setBellNormal(data.bells[0] ?? 0);
          setBellShort(data.bells[1] ?? 0);
        }
        if (Array.isArray(data.fire)) {
          setFireLength(data.fire[0] ?? 0);
          setFireGap(data.fire[1] ?? 0);
          setFireGap2(data.fire[2] ?? 0);
        }
      })
      .catch((err) => console.error("Settings fetch error:", err));
  };

  useEffect(() => {
    loadValues();
  }, []);

  const saveAll = () => {
    axios
      .patch(`${apiBase}/belldata/1/`, {
        bells: [bellNormal, bellShort],
        fire: [fireLength, fireGap, fireGap2],
      })
      .then(() => {
        showToast("Zapisano ustawienia.", "success");
        fetch('/bell/reload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      })
      .catch((err) => console.error("Save error:", err));
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
    <Container className="bg-secondary-subtle border border-primary-subtle p-4 rounded text-primary">
      <h4 className="mb-3 text-primary">Długość Dzwonków</h4>
      <Row>
        <Col md={6}>{renderSlider("Normalny", bellNormal, setBellNormal)}</Col>
        <Col md={6}>{renderSlider("Krótki", bellShort, setBellShort)}</Col>
      </Row>

      <h4 className="mb-3 text-primary">Alarm Pożarowy</h4>
      <Row>
        <Col md={4}>{renderSlider("Długość sygnału", fireLength, setFireLength)}</Col>
        <Col md={4}>{renderSlider("Przerwa w cyklu", fireGap, setFireGap)}</Col>
        <Col md={4}>{renderSlider("Przerwa między cyklami", fireGap2, setFireGap2)}</Col>
      </Row>
      <Row className="mt-4">
        <Col md={6}>
          <Button
            className="w-100 bg-danger-subtle border border-danger text-danger"
            onClick={loadValues}
          >
            Reset
          </Button>
        </Col>
        <Col md={6}>
          <Button
            className="w-100 bg-success-subtle border border-success text-success"
            onClick={saveAll}
          >
            Zapisz
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Sliders;
