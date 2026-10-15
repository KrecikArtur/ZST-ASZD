import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import { UseData } from './components/Login-Sys';

function Dashboard() {
  const [grocery, setGrocery] = useState([]);
  const [groceryName, setGroceryName] = useState('');
  const [groceryAmount, setGroceryAmount] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setGrocery(await UseData("get", "grocery"));
    }
    fetchData();
  }, []);

  async function handleDelete(id) {
    await UseData("delete", `grocery/${id}/`);
    setGrocery(grocery.filter(item => item.id !== id));
  }

  async function handleSubmitGrocery(e) {
    e.preventDefault();
    const newG = await UseData('post', "grocery", { name: groceryName, amount: parseInt(groceryAmount) });
    if (newG) setGrocery([...grocery, newG]);
    setGroceryName('');
  }

  return (
    <Sidebar>
      <div className='justify-content-center mb-3 text-center width-100'>
        <h2 className='text-success'>Lista Zakupów</h2>
        <hr />
        <Card className="bg-secondary-subtle border border-success-subtle mb-4 p-3">
          <Form onSubmit={handleSubmitGrocery}>
            <Row className="align-items-center">
              <Col xs={12} md={6} className="mb-2 mb-md-0">
                <Form.Control
                  type="text"
                  placeholder="Nazwa produktu..."
                  value={groceryName}
                  onChange={(e) => setGroceryName(e.target.value)}
                  required
                />
              </Col>
              <Col xs={6} md={3} className="mb-2 mb-md-0">
                <Form.Control
                  type="number"
                  min="1"
                  value={groceryAmount}
                  onChange={(e) => setGroceryAmount(e.target.value)}
                  required
                />
              </Col>
              <Col xs={6} md={3}>
                <Button type="submit" variant="success" className="w-100">Dodaj</Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card className="text-center text-success bg-secondary-subtle border border-success-subtle mb-4">
          <Card.Body>
            <Card.Text className="fs-4">
              {grocery?.map((item) => (
                <div key={item.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className='pd-5 fs-1 bg-danger-subtle text-danger border-danger' onClick={() => handleDelete(item.id)}>X</button>
                    <h3 style={{ margin: 0 }}>x{item.amount}</h3>
                    <h2>|</h2>
                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                  </div>
                  <hr />
                </div>
              ))}
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    </Sidebar>
  );
}

export default Dashboard;