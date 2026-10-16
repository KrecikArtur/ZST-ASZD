import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { showToast } from './Toaster';
import { logout } from './Login-Sys';

function Sidebar({ children }) {
  const navigate = useNavigate();
  const menuItems = [
    { name: 'Panel sterowania', path: '/dashboard', style: 'border-success text-success' },
    { name: 'Edytuj plan', path: '/planedit/normalny', style: 'border-info text-info' },
    { name: 'Ustawienia', path: '/options', style: 'border-info text-info' },
  ];

  const handleLogout = () => {
    logout();
    showToast('Wylogowano.', 'danger');
    navigate('/login', { replace: true });
  };

  return (
    <Container fluid className="min-vh-100 d-flex flex-column p-0">
      <Row className="flex-grow-1 g-0">
        <Col
          xs={12}
          md={4}
          lg={2}
          className="bg-primary-subtle border-end border-primary-subtle d-flex flex-column p-3"
        >
          <div className="d-flex flex-column h-100">
            <img
              src="/logo.png"
              alt="Logo"
              className="img-fluid mb-3 mx-auto"
              style={{ maxHeight: '120px', objectFit: 'contain' }}
            />
            <h4 className="text-center text-primary">Sterownik dzwonków</h4>
            <hr />

            <div className="d-flex flex-column gap-3">
              {menuItems.map(item => (
                <Button
                  key={item.path}
                  className={`${item.style} bg-secondary-subtle border p-3 rounded d-flex flex-column align-items-center`}
                  onClick={() => navigate(item.path, { replace: true })}
                >
                  <span className="fs-5 text-center">{item.name}</span>
                </Button>
              ))}
              <hr className="mt-auto" />
              <Button
                className="w-100 bg-secondary-subtle border border-danger-subtle text-danger"
                onClick={handleLogout}
              >
                Wyloguj
              </Button>
            </div>
          </div>
        </Col>

        <Col
          xs={12}
          md={8}
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
