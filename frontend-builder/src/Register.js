import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from './components/Toaster';
import { register } from "./components/Login-Sys";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!username||!password||!code) { 
      showToast("Wszystkie pola są wymagane.", "danger");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      showToast("Hasła nie są zgodne.", "danger");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      showToast("Hasło powinno mieć co najmniej 8 znaków", "danger");
      setLoading(false);
      return;
    }
    const res = await register(username, password, code);
    if (res === "success") { showToast("Zarejestrowano.", "success"); navigate("/login", { replace: true });}
    else if (res === "error") { showToast("Błąd rejestracji.", "danger"); }
    else if (res["code"]) { showToast("Nieprawidłowy kod potwierdzający.", "danger"); }
    else if (res["username"]) { showToast("Nazwa użytkownika już zajęta.", "danger"); }
    setLoading(false);
  };

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
            <div className="mb-3">
              <input
                type="Password"
                className="form-control border border-primary-subtle"
                placeholder="Powtórz Hasło"
                maxLength={25}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="input"
                className="form-control border border-primary-subtle"
                placeholder="Kod Potwierdzający"
                maxLength={25}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="text-center mb-3" style={{ height: '2rem' }}>
              {loading && (<div className="spinner-border text-danger" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                <span className="visually-hidden">Ładowanie...</span>
              </div>)}
            </div>
            <div className="d-flex justify-content-center align-items-center mt-2">
              <button
                className="btn text-primary bg-primary-subtle border border-primary-subtle px-5"
                type="submit"
                disabled={loading}
              >Zarejestruj</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </>
);
}

export default Register;
