import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import { UseData } from './components/Login-Sys';

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

function Dashboard() {
  const [date, setDate] = useState([]);

  const fetchData = async () => {
    const dane = await UseData("get", "calendar");
    setDate(dane);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Sidebar>
      <div className='justify-content-center mb-3 text-center w-100'>
        <Clock />
        <hr/>
        <div className="d-flex justify-content-between align-items-center mb-3">
        Work In Progress
        </div>
      </div>
    </Sidebar>
  );
}

export default Dashboard;