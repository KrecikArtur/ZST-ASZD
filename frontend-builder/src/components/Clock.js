import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = now.toLocaleDateString('pl-PL', { weekday: 'long' });
  const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString();

  return (
    <div className="bg-secondary-subtle border border-primary-subtle text-white p-3 rounded text-center">
      <h3 className='fs-3 text-primary'>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
      <p className="mb-1 fs-4 text-primary">{date}</p>
      <p className='fs-2 text-primary'>{time}</p>
    </div>
  );
};

export default Clock;
