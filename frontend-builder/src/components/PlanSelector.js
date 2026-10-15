import React from "react";
import { Row, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const PlanSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const plans = [
    { label: "Normalny", path: "norm" },
    { label: "Alternatywny A", path: "alta" },
    { label: "Alternatywny B", path: "altb" },
    { label: "Alternatywny C", path: "altc" },
  ];

  const handleClick = (path) => {
    navigate(`/planedit/${path}`, { replace: true });
  };

  return (
      <div className="w-100 bg-primary-subtle border border-primary-subtle p-4 rounded text-center">
        <Row className="justify-content-center gap-5">
          {plans.map((plan) => {
            const isActive = location.pathname === `/planedit/${plan.path}`;
            return (
              <Button
                key={plan.path}
                onClick={() => handleClick(plan.path)}
                className={`fs-4 py-4 col-md-2 border rounded ${
                  isActive
                    ? "border-success text-success bg-success-subtle shadow"
                    : "bg-secondary-subtle border-info text-info"
                }`}
              >
                {plan.label}
              </Button>
            );
          })}
        </Row>
      </div>
  );
};

export default PlanSelector;
