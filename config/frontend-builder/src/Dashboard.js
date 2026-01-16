import React, { useEffect, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import ModeSelector from './components/ModeSelector';
import ActionButtons from './components/ActionButtons';

const Dashboard = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return(
    <Sidebar>
      <Row className="justify-content-center mb-3"><Col md="3"><div className="bg-secondary-subtle border border-primary-subtle text-white p-3 rounded text-center">
        <h3 className="text-primary">{time.toLocaleDateString('pl-PL')}</h3>
        <h2 className='text-primary'>{time.toLocaleDateString('pl-PL', { weekday: 'long' }).charAt(0).toUpperCase() + time.toLocaleDateString('pl-PL', { weekday: 'long' }).slice(1)}</h2>
        <h3 className='text-primary'>{time.toLocaleTimeString('pl-PL')}</h3>
      </div></Col></Row>
      <hr />
      <Row className="justify-content-center text-center mb-3"><Col md="6"><ModeSelector /></Col></Row>
      <hr />
      <ActionButtons />
    </Sidebar>
  );
}
export default Dashboard;
