import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { showToast } from './components/Toaster';
import Sidebar from './components/Sidebar';
import PlanSelector from './components/PlanSelector';
import HourEditor from './components/HourEditor';

const apiBase = `http://${window.location.hostname}/api`;

const Plan = () => {
  const { option } = useParams();
  const [hours, setHours] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHour, setNewHour] = useState('');
  const [newPrebell, setNewPrebell] = useState(false);
  const AddPopup = () => setShowModal(true);

  const ScheduleReload = () => {
    axios.get(`${apiBase}/schedule/?option=${option}`)
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
    showToast('Usunięto godzinę.', 'danger');
  };

  const ScheduleSave = () => {
    axios.put(`${apiBase}/schedule/${option}/`, hours)
      .catch(err => console.error('Save Error', err));
      fetch('/bell/reload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
    showToast('Zapisano godziny.', 'success');
  };

  const handleAddConfirm = () => {
    if (!hours.some(h => h.hour === newHour)) {
      const updated = [
        ...hours,
        { hour: newHour, prebell: newPrebell }
      ].sort((a, b) => a.hour.localeCompare(b.hour));
      setHours(updated);
      setShowModal(false);
      setNewHour('12:00');
      setNewPrebell(false);
      showToast('Dodano godzinę.', 'success');
    } else {
      showToast('Godzina już istnieje!', 'danger');
    }
  };

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
              <Form className="d-flex justify-content-center flex-column align-items-center text-center">
                <Form.Group className="mb-4 w-100">
                  <Form.Label className="fw-semibold">Godzina</Form.Label>
                  <Form.Control
                    type="time"
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    step="60"
                    className="w-50 mx-auto text-center fw-bold border border-primary-subtle bg-dark"
                  />
                </Form.Group>

                <Form.Group className="w-100">
                  <Form.Check
                    type="switch"
                    id="prebell-switch"
                    label="Z dodatkowym krótkim dzwonkiem? (Lekcja)"
                    checked={newPrebell}
                    onChange={(e) => setNewPrebell(e.target.checked)}
                    className="fw-semibold"
                  />
                </Form.Group>
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
