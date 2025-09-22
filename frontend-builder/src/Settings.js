import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import Sliders from './components/settingsliders';

const Dashboard = () => (
  <Container fluid>
    <Row>
      <Col md={2} className="bg-primary-subtle border border-primary-subtle rounded">
        <Sidebar />
      </Col>
      <Col md={10} className="p-3 bg-dark text-white vh-100 text-center overflow-auto">
        <h1 className='text-primary'>Ustawienia</h1>
        <hr/>
        <Sliders />
      </Col>
    </Row>
  </Container>
);

export default Dashboard;
