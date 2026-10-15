// src/utils/auth.js
import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";
import axios from "axios";
const apiBase = `https://cal.plociennik.info`;

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
  const decoded = jwtDecode(access);
  localStorage.setItem("isAdmin", decoded.is_staff);
  localStorage.setItem("user", decoded.user_id);
  localStorage.setItem("username", decoded.username);
  if (refresh) {
    localStorage.setItem("refresh", refresh);
  }
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
  if (!access) {return <Navigate to="/login" replace />;}
  return children;
}

export async function register(username, password, code) {
  try {
    const data = { username, password, code };
    const res = await axios.post(`${apiBase}/api/register/`, data)
    return res.data.response
  } catch(err) {return "error";}
}

export async function UseData(type, url, data={}) {
  try {
    const token = TokenCheck();
    let res = null;
    switch(type) {
        case "get":
          res = await axios.get(`${apiBase}/api/${url}`, {headers: {Authorization: `Bearer ${token}`,},});
        break;
        case "post":
          res = await axios.post(`${apiBase}/api/${url}/`, data, {headers: {Authorization: `Bearer ${token}`,},});
        break;
        case "put":
          res = await axios.put(`${apiBase}/api/${url}`, data, {headers: {Authorization: `Bearer ${token}`,},});
        break;
        case "delete":
          res = await axios.delete(`${apiBase}/api/${url}`, {headers: {Authorization: `Bearer ${token}`,},});
        break;
        default:
          return;
    }
    return res.data;
  } catch(err) {window.location.href = "/dashboard"; return err}
}

export async function frontPing(url, data) {
  try {
    const res = await axios.post(`${apiBase}/${url}`, data);
    if (!res || !res.data) throw new Error('No response data');
    return res.data;
  } catch (err) {
    return { error: true, message: err.message };
  }
}