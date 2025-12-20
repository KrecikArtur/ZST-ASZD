import React, { useState } from 'react';
import { Row, Col, Button, Modal } from 'react-bootstrap';
import { saveData, frontPing } from "./Login-Sys";
import { showToast } from './Toaster';

const ActionButtons = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingLabel, setPendingLabel] = useState("");

  const openConfirm = (statusValue, label) => {
    setPendingAction(statusValue);
    setPendingLabel(label);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (pendingAction === null) return;
    try {
      await saveData("belldata/1", { status: pendingAction });
      await frontPing("bell/reload", {});
      showToast("Akcja Wykonana!", "success");
      console.log("Bell reloaded via frontPing");
    } catch (err) {
      console.error("Bell update error:", err);
    } finally {
      setShowConfirm(false);
      setPendingAction(null);
      setPendingLabel("");
    }
  };

  return (
    <>
      <div className="bg-primary-subtle border border-primary-subtle text-white p-4 rounded">
        <Row>
          <Col xs={6} className="mb-4">
            <Button
              className="w-100 bg-secondary-subtle border border-primary-subtle text-primary"
              onClick={() => openConfirm(1, "Zadzwoń Dzwonkiem")}
            >
              Zadzwoń Dzwonkiem
            </Button>
          </Col>

          <Col xs={6} className="mb-4">
            <Button
              className="w-100 bg-secondary-subtle border border-primary-subtle text-primary"
              onClick={() => openConfirm(0, "Odwołaj Alarm")}
            >
              Odwołaj Alarm
            </Button>
          </Col>

          <Col xs={6}>
            <Button
              className="w-100 bg-secondary-subtle border border-primary-subtle text-primary"
              onClick={() => openConfirm(2, "Pożar")}
            >
              Pożar
            </Button>
          </Col>

          <Col xs={6}>
            <Button
              className="w-100 bg-secondary-subtle border border-primary-subtle text-primary"
              onClick={() => openConfirm(3, "Barykada")}
            >
              Barykada
            </Button>
          </Col>
        </Row>
      </div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header className="bg-danger-subtle border border-danger-subtle rounded-top">
          <Modal.Title className="w-100 text-center text-danger fw-bold">
            Ostrzeżenie
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-secondary-subtle text-center border-start border-end border-primary-subtle">
          <p className="mb-2 fs-6">Czy na pewno chcesz wykonać akcję:</p>
          <h5 className="fw-semibold text-danger">{pendingLabel}</h5>
        </Modal.Body>

        <Modal.Footer className="bg-secondary-subtle border border-primary-subtle rounded-bottom d-flex justify-content-center">
          <Button
            className="px-4 bg-danger-subtle border border-danger text-danger fw-semibold"
            onClick={() => setShowConfirm(false)}
          >
            Anuluj
          </Button>

          <Button
            className="px-4 bg-success-subtle border border-success text-success fw-semibold"
            onClick={handleConfirm}
          >
            Potwierdź
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ActionButtons;
