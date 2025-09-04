// src/utils/auth.js
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const apiBase = `http://${window.location.hostname}:8080`;

export function setTokens(access, refresh) {
  localStorage.setItem("access", access);
  if (refresh) {
    localStorage.setItem("refresh", refresh);
  }
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh");
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await axios.post(`${apiBase}/api/token/refresh/`, {
      refresh: refresh
    });
    setTokens(res.data.access);
    return true;
  } catch {
    logout();
    return false;
  }
}