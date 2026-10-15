import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";
import axios from "axios";

// The Pi serves the frontend and proxies /api/ to Django on the same host.
// Set REACT_APP_API_BASE_URL only when the API is hosted separately.
const apiBase = (process.env.REACT_APP_API_BASE_URL || window.location.origin).replace(/\/$/, "");
let refreshRequest = null;

function tokenIsValid(token) {
  if (!token) return false;
  try {
    return jwtDecode(token).exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function getAccessToken() {
  const access = localStorage.getItem("access");
  if (tokenIsValid(access)) return access;

  const refresh = localStorage.getItem("refresh");
  if (!tokenIsValid(refresh)) {
    logout();
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = axios.post(`${apiBase}/api/token/refresh/`, { refresh })
      .then(({ data }) => {
        setTokens(data.access, data.refresh || refresh);
        return data.access;
      })
      .catch(() => {
        logout();
        return null;
      })
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

export async function login(username, password) {
  const { data } = await axios.post(`${apiBase}/api/token/`, { username, password });
  setTokens(data.access, data.refresh);
  return data.access;
}

export function logout() {
  ["access", "refresh", "isAdmin", "user", "username"].forEach(key => localStorage.removeItem(key));
}

export function setTokens(access, refresh) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
  try {
    const decoded = jwtDecode(access);
    if (decoded.is_staff !== undefined) localStorage.setItem("isAdmin", String(decoded.is_staff));
    if (decoded.user_id !== undefined) localStorage.setItem("user", String(decoded.user_id));
    if (decoded.username !== undefined) localStorage.setItem("username", decoded.username);
  } catch {
    logout();
  }
}

// Synchronous check retained for existing callers; refresh is handled by getAccessToken.
export function TokenCheck() {
  const token = localStorage.getItem("access");
  return tokenIsValid(token) ? token : false;
}

export function RequireAuth({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    let active = true;
    getAccessToken().then(token => {
      if (active) setAuthorized(Boolean(token));
    });
    return () => { active = false; };
  }, []);

  if (authorized === null) return null;
  if (!authorized) return <Navigate to="/login" replace />;
  return children;
}

export async function register(username, password, code) {
  try {
    const { data } = await axios.post(`${apiBase}/api/register/`, { username, password, code });
    return data.response;
  } catch (error) {
    return error.response?.data?.response || "error";
  }
}

async function apiRequest(method, url, data) {
  const token = await getAccessToken();
  if (!token) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  const path = url.replace(/^\/+/, "");
  const response = await axios({
    method,
    url: `${apiBase}/api/${path}`,
    ...(data === undefined ? {} : { data }),
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export const getData = url => apiRequest("get", url);
export const saveData = (url, data) => apiRequest("patch", url, data);
export const putData = (url, data) => apiRequest("put", url, data);

// Compatibility with the updated screens in akualizacje/src.
export function UseData(type, url, data = {}) {
  const methods = { get: "get", post: "post", put: "put", delete: "delete" };
  if (!methods[type]) return Promise.reject(new Error(`Nieobsługiwana metoda: ${type}`));
  return apiRequest(methods[type], url, type === "get" || type === "delete" ? undefined : data);
}

export async function frontPing(url, data) {
  try {
    const response = await axios.post(`${apiBase}/${url.replace(/^\/+/, "")}`, data);
    return response.data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}
