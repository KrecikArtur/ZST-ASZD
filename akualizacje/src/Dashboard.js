import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { UseData } from './components/Login-Sys';
import Calendar from './components/calendar';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="text-center text-success bg-secondary-subtle border border-success-subtle mb-3">
      <Card.Body>
        <Card.Title>{time.toLocaleDateString('pl-PL')}</Card.Title>
        <Card.Text className="fs-3">
          {time.toLocaleTimeString('pl-PL')}
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

function Adder({ show, handleClose, onEventAdded, userGroups }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '', 
    endDate: '',   
    startTime: '',
    endTime: '',
    group: userGroups[0]?.id || '',
    color: '0' 
  });

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (userGroups.length > 0) {
      setFormData(prev => {
        if (!prev.group) {
          return { ...prev, group: userGroups[0].id };
        }
        return prev;
      });
    }
  }, [userGroups]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };

      if (name === 'startDate' && !prev.endDate) {
        updatedData.endDate = value;
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalStartTime = formData.startTime ? `${formData.startTime}:00` : "00:00:00";
    const stimeISO = `${formData.startDate}T${finalStartTime}.000Z`;

    const finalEndDate = formData.endDate || formData.startDate;
    const finalEndTime = formData.endTime ? `${formData.endTime}:00` : "23:59:59";
    const etimeISO = `${finalEndDate}T${finalEndTime}.000Z`;

    const payload = {
      name: formData.name,
      description: formData.description,
      group: Number(formData.group),
      stime: stimeISO,
      etime: etimeISO,
      color: Number(formData.color)
    };

    try {
      await UseData("post", "calendar", payload);
      
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        group: userGroups[0]?.id || '',
        color: '0'
      });

      if (onEventAdded) onEventAdded();
      handleClose();
    } catch (error) {
      console.error("Błąd podczas dodawania wydarzenia:", error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-secondary-subtle border-success-subtle">
          <Modal.Title className="text-success text-center fw-bold w-100">Nowe Wydarzenie</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-secondary-subtle">
          <Row className="mb-2">
            <Form.Group as={Col} xs={12} md={5} controlId="formEventName">
              <Form.Label className="text-success-emphasis fw-semibold">Nazwa</Form.Label>
              <Form.Control 
                type="text" 
                name="name" 
                placeholder="Nazwa wydarzenia" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>
            <Form.Group as={Col} xs={6} md={3} controlId="formEventGroup">
              <Form.Label className="text-success-emphasis fw-semibold">Grupa</Form.Label>
              <Form.Select 
                name="group" 
                value={formData.group} 
                onChange={handleChange} 
                required
              >
                {userGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} xs={6} md={4} controlId="formEventColor">
              <Form.Label className="text-success-emphasis fw-semibold">Kolor paska</Form.Label>
              <Form.Select 
                name="color" 
                value={formData.color} 
                onChange={handleChange} 
                required
              >
                <option value="0">Niebieski</option>
                <option value="1">Zielony</option>
                <option value="2">Żółty</option>
                <option value="3">Czerwony</option>
                <option value="4">Morski</option>
                <option value="5">Czarny</option>
                <option value="6">Biały</option>
              </Form.Select>
            </Form.Group>
          </Row>
          <Form.Group className="mb-2" controlId="formEventDescription">
            <Form.Label className="text-success-emphasis fw-semibold">Opis</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={2} 
              name="description" 
              placeholder="Opis wydarzenia..." 
              value={formData.description} 
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Row className="mb-2">
            <Form.Group as={Col} controlId="formEventStartDate">
              <Form.Label className="text-success-emphasis fw-semibold">Data rozpoczęcia</Form.Label>
              <Form.Control 
                type="date" 
                name="startDate" 
                min={getTodayDateString()} 
                value={formData.startDate} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formEventStartTime">
              <Form.Label className="text-success-emphasis fw-semibold">Godzina rozpoczęcia</Form.Label>
              <Form.Control 
                type="time" 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleChange} 
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formEventEndDate">
              <Form.Label className="text-success-emphasis fw-semibold">Data zakończenia</Form.Label>
              <Form.Control 
                type="date" 
                name="endDate" 
                min={formData.startDate || getTodayDateString()} 
                value={formData.endDate} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formEventEndTime">
              <Form.Label className="text-success-emphasis fw-semibold">Godzina zakończenia</Form.Label>
              <Form.Control 
                type="time" 
                name="endTime" 
                min={formData.startDate === formData.endDate ? formData.startTime : undefined} 
                value={formData.endTime} 
                onChange={handleChange} 
              />
            </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-secondary-subtle border-success-subtle justify-content-center">
          <Button className="bg-danger-subtle text-danger border-danger" onClick={handleClose}>
            Anuluj
          </Button>
          <Button type="submit" className="bg-success-subtle text-success border-success">Zapisz wydarzenie</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function Dashboard() {
  const [date, setDate] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userGroups, setUserGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec","Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

  const fetchData = async () => {
    const dane = await UseData("get", "calendar");
    setDate(dane);
    try {
      const daneGrup = await UseData("get", "groups");
      setUserGroups(daneGrup || []);
    } catch (err) {
      console.error("Błąd ładowania grup:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlechangeMonth = (direction) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  return (
    <Sidebar>
      <div className='justify-content-center mb-3 text-center w-100'>
        <Clock />
        <hr/>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="outline-success" onClick={() => handlechangeMonth(-1)}>&lt;-</Button>
          <h3 className="text-success m-0 text-capitalize fw-bold">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <Button variant="outline-success" onClick={() => handlechangeMonth(1)}>-&gt;</Button>
        </div>
        <Calendar dane={date} currentDate={currentDate} />
        <hr/>
        <Button className={`w-100 bg-secondary-subtle border p-2 rounded d-flex text-success border-success-subtle flex-column align-items-center`}
        onClick={() => navigate("/events", { replace: true })}>
        Wydarzenia </Button>

        <Adder
        show={showModal} 
        handleClose={() => setShowModal(false)} 
        onEventAdded={fetchData} 
        userGroups={userGroups} 
      />
        <Button 
          variant="success" 
          onClick={() => setShowModal(true)}
          className="rounded-3 shadow-lg d-flex align-items-center justify-content-center fw-bold"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            fontSize: '28px'
          }}
        >+</Button>
      </div>
    </Sidebar>
  );
}

export default Dashboard;