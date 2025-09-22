import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import WeekModes from './components/WeekModes';
import Clock from './components/Clock';
import BellAction from './components/BellAction';

const Dashboard = () => (
  <Container fluid>
    <Row>
      <Col md={2} className="bg-primary-subtle border border-primary-subtle rounded">
        <Sidebar />
      </Col>
      <Col md={10} className="p-3 bg-dark text-white vh-100">
        <Row className="justify-content-center mb-3">
          <Col md="3">
            <Clock />
          </Col>
        </Row>
        <hr />
        <Row className="justify-content-center text-center mb-3">
          <Col md="6">
        <WeekModes />
          </Col>
        </Row>
        <hr />
        <BellAction />
      </Col>
    </Row>
  </Container>
);

export default Dashboard;
