import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { showToast } from './components/Toaster';
import Sidebar from './components/Sidebar';
import PlanSelector from './components/PlanSelector';
import HourEditor from './components/HourEditor';

const apiBase = `http://${window.location.hostname}:8080`;

const Plan = () => {
  const { option } = useParams();
  const [hours, setHours] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHour, setNewHour] = useState('');

  const ScheduleReload = () => {
    axios.get(`${apiBase}/api/schedule/?option=${option}`)
      .then(res => {
        setHours(res.data);
      })
      .catch(err => console.error('Schedule Error', err));
  };

  useEffect(() => {
    ScheduleReload();
  }, [option]);

  const HourRemoved = (hourObj) => {
    setHours(hours.filter(h => h !== hourObj));
  };

  const ScheduleSave = () => {
    axios.put(`${apiBase}/api/schedule/${option}/`, hours)
      .catch(err => console.error('Save Error', err));
      fetch('/api/reload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
    showToast('Zapisano godziny.', 'success');
  };

  const AddPopup = () => setShowModal(true);

  // shit start
  const [newPrebell, setNewPrebell] = useState(false);

  const handleAddConfirm = () => {
    if (!hours.some(h => h.hour === newHour)) {
      const updated = [
        ...hours,
        { hour: newHour, prebell: newPrebell }
      ].sort((a, b) => a.hour.localeCompare(b.hour));
      setHours(updated);
      setShowModal(false);
      setNewHour('08:00');
      setNewPrebell(false);
    } else {
      alert('Godzina już istnieje.');
    }
  };

  //shit end

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-primary-subtle border border-primary-subtle rounded">
          <Sidebar />
        </Col>
        <Col md={10} className="bg-dark text-white p-4 vh-100 overflow-auto text-center">
          <h1 className='text-primary'>Edytor Planu</h1>
          <hr />
          <PlanSelector />
          <hr />
          <Row className="d-flex justify-content-center gap-3">
            <Col md={3}>
              <Button 
                className="w-100 bg-danger-subtle border border-danger text-danger"
                onClick={ScheduleReload}
              >
                Reset
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                className="w-100 bg-primary-subtle border border-primary-subtle text-primary"
                onClick={AddPopup}
              >
                Dodaj
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                className="w-100 bg-success-subtle border border-success text-success"
                onClick={ScheduleSave}
              > Zapisz </Button>
            </Col>
          </Row>
          <hr />
          <Row className="d-flex justify-content-center mt-3">
            <HourEditor edittime={hours} removed={HourRemoved} />
          </Row>


          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="bg-primary-subtle border border-primary-subtle">
              <Modal.Title className="text-primary fw-bold">Dodaj nową godzinę</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-secondary-subtle border border-primary-subtle">
              <Form>
                <Row className="mb-3 text-center">
                  <Col>
                    <Form.Label className="fw-semibold">Godzina</Form.Label>
                    <Form.Select
                      value={newHour.split(":")[0] || ""}
                      onChange={(e) => setNewHour(`${e.target.value}:${newHour.split(":")[1] || "00"}`)}
                    >
                      {[...Array(24).keys()].map((h) => (
                        <option key={h} value={String(h).padStart(2, "0")}>
                          {String(h).padStart(2, "0")}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col>
                    <Form.Label className="fw-semibold">Minuty</Form.Label>
                    <Form.Select
                      value={newHour.split(":")[1] || ""}
                      onChange={(e) => setNewHour(`${newHour.split(":")[0] || "00"}:${e.target.value}`)}
                    >
                      {[...Array(60).keys()].map((m) => (
                        <option key={m} value={String(m).padStart(2, "0")}>
                          {String(m).padStart(2, "0")}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Form.Check 
                      type="switch"
                      id="prebell-switch"
                      label="(Lekcja) Z dodatkowym krótkim dzwonkiem?"
                      checked={newPrebell}
                      onChange={(e) => setNewPrebell(e.target.checked)}
                    />
                  </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer className="bg-secondary-subtle border border-primary-subtle">
              <Button 
                className="bg-danger-subtle border border-danger text-danger"
                onClick={() => setShowModal(false)}
              >
                Anuluj
              </Button>
              <Button 
                className="bg-success-subtle border border-success text-success"
                onClick={handleAddConfirm}
              >
                Dodaj
              </Button>
            </Modal.Footer>
          </Modal>



        </Col>
      </Row>
    </Container>
  );
};

export default Plan;
