import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { showToast } from './Toaster';
import { logout } from "./Login-Sys";

function Sidebar({ children }) {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Panel', path: '/dashboard', style: 'border-success text-success' },
    { name: 'Zakupy', path: `/list`, style: 'border-secondary text-secondary' },
  ];  

  const handlelogout = () => {
    logout();
    showToast("Wylogowano.", "danger");
    navigate('/login', { replace: true });
  };

  return (
    <Container fluid className="min-vh-100 d-flex flex-column p-0">
      <Row className="flex-grow-1 g-0">
        <Col 
          md={3} 
          lg={2} 
          className="bg-success-subtle border-end border-success-subtle rounded-end d-flex flex-column p-3"
        >
          <div className="d-flex flex-column h-100" style={{ minWidth: '200px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              className="img-fluid mb-3 mx-auto"
              style={{ maxHeight: '120px', objectFit: 'contain' }}
            />
            <h3 className="text-center text-success">Kalendarz</h3>
            <hr />
            
            <div className="d-flex flex-column gap-3">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  className={`${item.style} bg-secondary-subtle border p-4 rounded d-flex flex-column align-items-center`}
                  onClick={() => navigate(item.path, { replace: true })}
                >
                  <div className="fs-4 text-center">{item.name}</div>
                </Button>
              ))}
              <hr className="mt-auto" />
              <Button
                className="w-100 bg-secondary-subtle border border-danger-subtle text-danger"
                onClick={handlelogout}
              >
                Wyloguj
              </Button>
            </div>
          </div>
        </Col>

        <Col 
          md={9} 
          lg={10} 
          className="p-3 bg-dark text-white min-vh-100 overflow-auto"
        >
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default Sidebar;