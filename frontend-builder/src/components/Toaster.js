import React, { useEffect, useRef } from 'react';
import { Toast } from 'bootstrap';

const Toaster = () => {
  const toastRef = useRef(null);

  useEffect(() => {
    if (toastRef.current) {
      window.globalToast = new Toast(toastRef.current, { delay: 3000 });
    }
  }, []);

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
      <div
        id="globalToast"
        ref={toastRef}
        className="toast align-items-center text-bg-primary border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div id="globalToastBody" className="toast-body">
            Toast Error
          </div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
};
export default Toaster;

export function showToast(message, type = 'primary') {
  const toastEl = document.getElementById('globalToast');
  const toastBody = document.getElementById('globalToastBody');
  if (!toastEl || !toastBody || !window.globalToast) return;

  toastEl.className = `toast align-items-center text-${type} bg-${type}-subtle border border-${type}-subtle rounded`;
  toastBody.textContent = message;
  window.globalToast.show();
}
