import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { showToast } from './components/Toaster';
import { setTokens, getAccessToken, getRefreshToken, refreshAccessToken } from "./components/Login-Sys";
import Clock from './components/Clock';
const apiBase = `http://${window.location.hostname}:8080`;

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/api/token/`, {
        username,
        password,
      });
      setTokens(res.data.access, res.data.refresh);
      if (onLogin) onLogin(res.data.access);
      showToast("Zalogowano.", "success");
      navigate("/dashboard", { replace: true });
    } catch {
      showToast("Błędne dane logowania.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const autoLogin = async () => {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (!access && refresh) {
        const ok = await refreshAccessToken();
        if (ok) navigate("/dashboard", { replace: true });
      } else if (access) {
        navigate("/dashboard", { replace: true });
      }
    };
    autoLogin();
  }, [navigate]);

  return (
  <>
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4 text-center">
          <Clock />
          <hr />
          <form onSubmit={handleSubmit} className="p-4 bg-secondary-subtle border border-primary-subtle rounded">
            <img
            src="/logo.png"
            alt="Logo"
            className="img-fluid mb-4"
            style={{ maxHeight: '120px', objectFit: 'contain' }}
          />
            <div className="mb-3">
              <input
                className="form-control border border-primary-subtle"
                placeholder="Użytkownik"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control border border-primary-subtle"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-center mb-3" style={{ height: '2rem' }}>
              {loading && (
                <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <span className="visually-hidden">Ładowanie...</span>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-center align-items-center mt-2">
              <button
                className="btn text-primary bg-primary-subtle border border-primary-subtle px-5"
                type="submit"
                disabled={loading}
              >
                Zaloguj
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
);
}

export default Login;
