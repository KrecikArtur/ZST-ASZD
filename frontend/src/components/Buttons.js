import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';

const Buttons = ({ onReset, onSave, onAdd }) => (
  <Container fluid className="d-flex justify-content-center my-4">
    <div className="mb-4 w-50 bg-secondary-subtle border border-primary-subtle text-white p-4 rounded text-center">
      <Row className="mb-3">
        <Col>
          <Button variant="secondary" className="w-100 h-100" onClick={onReset}>Przywróć</Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button variant="success" className="w-100" onClick={onSave}>Zapisz</Button>
        </Col>
        <Col>
          <Button variant="primary" className="w-100" onClick={onAdd}>Dodaj</Button>
        </Col>
      </Row>
    </div>
  </Container>
);

export default Buttons;
