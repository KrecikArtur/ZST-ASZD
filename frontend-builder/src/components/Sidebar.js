import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from "./Login-Sys";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleEdit = (id) => {
    switch (id) {
      case 0:
        navigate('/dashboard', { replace: true });
        break;
      case 1:
        if (!location.pathname.startsWith('/planedit/')) {
          navigate('/planedit/norm', { replace: true });
        }
        break;
      case 2:
        navigate('/options', { replace: true });
        break;
    }
  };

  const Styles = {
    0: 'bg-success-subtle border-success text-success',
    1: 'bg-info-subtle border-info text-info',
    2: 'bg-info-subtle border-info text-info'
  };

  return (
    <div className="bg-primary-subtle text-white p-3 d-flex flex-column">
      <img
        src="/logo.png"
        alt="Logo"
        className="img-fluid mb-4"
        style={{ maxHeight: '120px', objectFit: 'contain' }}/>
      <h3 className="text-center text-primary">Sterownik Dzwonków</h3>
      <hr />

      {['Panel sterowania','Edytuj Plan', 'Ustawienia'].map((name,  index) => (
        <Button
          key={index}
          className={`mb-4 ${Styles[index]} border p-4 rounded d-flex flex-column align-items-center`}
          onClick={() => handleEdit(index)}
        >
          <div className="fs-4 text-center">{name}</div>
        </Button>
      ))}
      <hr />
      <Button
        className="w-100 mt-auto bg-danger-subtle border border-danger-subtle text-danger"
        onClick={logout}
      >
        Wyloguj
      </Button>
    </div>
  );
}

export default Sidebar;
