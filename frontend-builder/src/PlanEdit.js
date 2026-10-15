import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { showToast } from './components/Toaster';
import Sidebar from './components/Sidebar';
import PlanSelector from './components/PlanSelector';
import PlanEditor from './components/PlanEditor';
import { getData, putData, frontPing } from './components/Login-Sys';

const Plan = () => {
  const { option } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [hours, setHours] = useState([]);
  const [newLesson, setNewLesson] = useState('08:00');
  const [Length, setLength] = useState(45);

  const ScheduleReload = useCallback(async () => {
    try {
      const data = await getData(`schedule/?option=${option}`);
      setHours(data);
    } catch (err) {
      console.error('Schedule Error', err);
      showToast('Błąd ładowania planu!', 'danger');
    }
  }, [option]);

  useEffect(() => {
    ScheduleReload();
  }, [ScheduleReload]);

  const HourRemoved = (hourObj) => {
    setHours(hours.filter(h =>
      !(h.lesson === hourObj.lesson && h.brake === hourObj.brake)
    ));
    showToast('Usunięto wpis.', 'danger');
  };

  const ScheduleSave = async () => {
    try {
      await putData(`schedule/${option}`, hours);
      await frontPing('bell/reload', {});
      showToast('Zapisano plan.', 'success');
    } catch (err) {
      console.error('Save Error', err);
      showToast('Błąd podczas zapisu!', 'danger');
    }
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const handleAddConfirm = () => {
  const newStart = timeToMinutes(newLesson);
  const newEnd = newStart + Number(Length);
  const overlaps = hours.some(h => {
    const existingStart = timeToMinutes(h.lesson);
    const existingEnd = timeToMinutes(h.brake);
    return newStart < existingEnd && newEnd > existingStart;
  });
  if (overlaps) {
    showToast('Lekcja nachodzi na inną lekcje!', 'danger');
    return;
  }
  const date = new Date(0, 0, 0, 0, newStart);
  date.setMinutes(date.getMinutes() + Number(Length));
  const brake = date.toTimeString().slice(0, 5);
  const updated = [
    ...hours,
    {
      option,
      lesson: newLesson,
      brake
    }
  ].sort((a, b) => a.lesson.localeCompare(b.lesson));
  setHours(updated);
  setShowModal(false);
  showToast('Dodano wpis.', 'success');
};

  return (
    <Sidebar>
      <div className="text-center">
        <h1 className="text-primary">Edytor Planu</h1>
        <hr />
        <PlanSelector />
        <hr />
        <Row className="d-flex justify-content-center gap-3">
          <Col md={3}>
            <Button
              className="w-100 bg-secondary-subtle border border-danger text-danger"
              onClick={ScheduleReload}
            >Reset</Button>
          </Col>
          <Col md={3}>
            <Button
              className="w-100 bg-secondary-subtle border border-primary-subtle text-primary"
              onClick={() => setShowModal(true)}
            >Dodaj</Button>
          </Col>
          <Col md={3}>
            <Button
              className="w-100 bg-secondary-subtle border border-success text-success"
              onClick={ScheduleSave}
            >Zapisz</Button>
          </Col>
        </Row>
        <hr />
        <Row className="d-flex justify-content-center mt-3">
          <Col md={5}>
            <PlanEditor
            edittime={hours}
            removed={HourRemoved}
          />
          </Col>
        </Row>
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
        >
          <Modal.Header
            closeButton
            className="bg-primary-subtle border border-primary-subtle"
          ><Modal.Title className="text-primary fw-bold">Dodaj nowy wpis</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-secondary-subtle border border-primary-subtle">
            <Form className="text-center">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Rozpoczęcie Lekcji</Form.Label>
                <Form.Control
                  type="time"
                  value={newLesson}
                  onChange={(e) => setNewLesson(e.target.value)}
                  step="60"
                  className="text-center fw-bold border border-primary-subtle bg-dark"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-semibold">Czas Trwania</Form.Label>
                <Form.Range
                  min={10}
                  max={90}
                  step={5}
                  value={Length}
                  onChange={(e) => setLength(e.target.value)}
                /><small className="text-primary fw-bold">{Length} Minut</small>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-secondary-subtle border border-primary-subtle">
            <Button
              className="bg-danger-subtle border border-danger text-danger"
              onClick={() => setShowModal(false)}
            >Anuluj</Button>
            <Button
              className="bg-success-subtle border border-success text-success"
              onClick={handleAddConfirm}
            >Dodaj</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default Plan;
