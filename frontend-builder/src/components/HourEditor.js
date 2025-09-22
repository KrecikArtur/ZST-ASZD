import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

const HourEditor = ({ edittime, removed }) => {
  const godzinylekcyjne = edittime.filter(item => item.prebell);
  const godzinyprzerwy = edittime.filter(item => !item.prebell);

  const renderCards = (items) =>
    items.map((item, idx) => (
      <Card key={idx} className="mb-2 shadow-sm border border-primary-subtle">
        <Card.Body className="bg-primary-subtle text-primary d-flex flex-column justify-content-center align-items-center">
          <div className="mb-2 text-center">
            <h5 className="fw-bold mb-1">{item.hour.slice(0, 5)}</h5>
          </div>
          <Button
            className='w-50 bg-danger-subtle border border-danger text-danger'
            onClick={() => removed(item)}
          > Usuń </Button>
        </Card.Body>
      </Card>
    ));

  return (
    <div
      className="mx-auto bg-secondary-subtle border border-primary-subtle text-primary p-4 rounded"
      style={{ maxWidth: "1000px" }}
    >
      <h3 className="text-center mb-4">Godziny</h3>
      <Row>
        <Col md={6}>
          <h5 className="text-center mb-3">Lekcja</h5>
          {renderCards(godzinylekcyjne)}
        </Col>
        <Col md={6}>
          <h5 className="text-center mb-3">Przerwa</h5>
          {renderCards(godzinyprzerwy)}
        </Col>
      </Row>
    </div>
  );
};

export default HourEditor;
