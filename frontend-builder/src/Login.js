import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from './components/Toaster';
import { login, getAccessToken } from "./components/Login-Sys";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {showToast("Wszystkie pola są wymagane.", "danger"); return;}
    setLoading(true);
    try {
      await login(username, password);
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
      const token = await getAccessToken();
      if (token) {
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
          <form onSubmit={handleSubmit} className="p-4 bg-secondary-subtle rounded-4">
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
                maxLength={25}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control border border-primary-subtle"
                placeholder="Hasło"
                maxLength={25}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-center mb-3" style={{ height: '2rem' }}>
              {loading && (<div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                <span className="visually-hidden">Ładowanie...</span>
              </div>)}
            </div>
            <div className="d-flex justify-content-center align-items-center mt-2">
              <button
                className="btn text-primary bg-primary-subtle border border-primary-subtle px-5"
                type="submit"
                disabled={loading}
              >Zaloguj</button>
            </div>
          </form>
          <div className='p-4 bg-secondary-subtle rounded-4 mt-5'>
            <h5>Nie masz konta?</h5>
            <Link to="/login/register" className='text-primary'>Zarejestruj się!</Link>
          </div>
        </div>
      </div>
    </div>
  </>
);
}

export default Login;
