import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

const PlanEditor = ({ edittime, removed }) => {

  const renderCards = () =>
    edittime.map((item, idx) => (
      <Card
        key={idx}
        className="mb-2 shadow-sm border border-primary-subtle"
      >
        <Card.Body className="bg-secondary-subtle text-primary">
          <Row className="align-items-center text-center">
            <Col md={4}>
              <h5 className="fw-bold">{idx}.</h5>
              <Button
                className="bg-secondary-subtle border border-danger text-danger px-2"
                onClick={() => removed(item)}
              >Usuń</Button>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold">Lekcja</h5>
              <div className="fs-5">
                {item.lesson?.slice(0, 5)}
              </div>
            </Col>
            <Col md={4}>
              <h5 className='fw-bold'>Przerwa</h5>
              <div className="fs-5">
                {item.brake?.slice(0, 5)}
              </div>
            </Col>

          </Row>
        </Card.Body>
      </Card>
    ));

  return (
    <div
      className="mx-auto bg-primary-subtle border border-primary-subtle text-primary p-4 rounded"
      style={{ maxWidth: '1000px' }}
    >
      <h3 className="text-center mb-4">Plan lekcji</h3>
      {renderCards()}
    </div>
  );
};

export default PlanEditor;