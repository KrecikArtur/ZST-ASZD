import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { showToast } from './Toaster';
import { logout } from "./Login-Sys";

function Sidebar({ children }) {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Panel sterowania', path: '/dashboard', style: ' border-success text-success' },
    { name: 'Edytuj Plan', path: '/planedit/norm', style: ' border-info text-info' },
    { name: 'Ustawienia', path: '/options', style: ' border-info text-info' },
  ];

  const handleLogout = () => {
    logout();
    showToast("Wylogowano.", "danger");
    navigate('/login', { replace: true });
  };

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-primary-subtle border border-primary-subtle rounded" >
          <div className="bg-primary-subtle text-primary p-3 d-flex flex-column"style={{ minWidth: '200px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              className="img-fluid mb-3"
              style={{ maxHeight: '120px', objectFit: 'contain' }}/>
            <h4 className="text-center text-primary">Sterownik Dzwonków</h4>
            <hr />
            {menuItems.map((item, index) => (
              <Button
                key={index}
                className={`mb-4 ${item.style} bg-secondary-subtle border p-4 rounded d-flex flex-column align-items-center`}
                onClick={() => navigate(item.path, { replace: true })}
              ><div className="fs-4 text-center">{item.name}</div></Button>
            ))}
            <hr />
            <Button
              className="w-100 mt-auto bg-secondary-subtle border border-danger-subtle text-danger"
              onClick={handleLogout}
            >Wyloguj</Button>
          </div>
        </Col>
        <Col md={10} className="p-3 bg-dark text-white vh-100 overflow-auto">{children}</Col>
      </Row>
    </Container>
  );
}

export default Sidebar;