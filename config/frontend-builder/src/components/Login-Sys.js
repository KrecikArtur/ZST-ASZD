// src/utils/login-sys.js
import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";
import axios from "axios";
const apiBase = `http://bell.local`;

// --- Authentication ---
export async function login(username, password) {
  try {
    const res = await axios.post(`${apiBase}/api/token/`, { username, password });
    setTokens(res.data.access, res.data.refresh);
    return res.data.access;
  } catch (error) {
    throw error;
  }
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function setTokens(access, refresh) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}

export function TokenCheck() {
  const token = localStorage.getItem("access");
  try {
    if (!token) {throw new Error(0);}
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {throw new Error();}
    return token
  } catch (err) {
    try {
      if (err.message === "0") {return false;}
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {return false}
      if (jwtDecode(refresh).exp * 1000 < Date.now()) throw new Error();
      const res = axios.post(`${apiBase}/api/token/refresh/`, {refresh: refresh});
      setTokens(res.data.access);
      return res.data.access;
    } catch (err) {return false}
  }
}

export function RequireAuth({ children }) {
  const access = TokenCheck();
  if (!access) return <Navigate to="/login" replace />;
  return children;
}

// --- Registration ---
export async function register(username, password, code) {
  try {
    const res = await axios.post(`${apiBase}/api/register/`, { username, password, code });
    return res.data.response;
  } catch {
    return "error";
  }
}

// GET request
export async function getData(url) {
  try {
    const token = TokenCheck();
    const res = await axios.get(`${apiBase}/api/${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    window.location.href = "/dashboard";
    return;
  }
}

// PATCH request for updates
export async function saveData(url, data) {
  try {
    const token = TokenCheck();
    const res = await axios.patch(`${apiBase}/api/${url}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    window.location.href = "/dashboard";
    return err;
  }
}

// PUT request for full replacements
export async function putData(url, data) {
  try {
    const token = TokenCheck();
    const res = await axios.put(`${apiBase}/api/${url}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    //window.location.href = "/dashboard";
    return err;
  }
}

// Frontend server ping
export async function frontPing(url, data) {
  try {
    const res = await axios.post(`${apiBase}/${url}`, data);
    if (!res || !res.data) throw new Error("No response data");
    return res.data;
  } catch (err) {
    return { error: true, message: err.message };
  }
}
