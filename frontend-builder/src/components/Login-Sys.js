import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";
import axios from "axios";

const apiBase = "http://bell.local";
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

export async function UseData(type, url, data = {}) {
  const methods = { get: "get", post: "post", put: "put", patch: "patch", delete: "delete" };
  const method = methods[type];
  if (!method) throw new Error(`Nieobsługiwana metoda: ${type}`);

  const token = await getAccessToken();
  if (!token) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  const [pathname, query] = url.replace(/^\/+/, "").split(/\?(.*)/s, 2);
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const path = query === undefined ? normalizedPath : `${normalizedPath}?${query}`;
  const response = await axios({
    method,
    url: `${apiBase}/api/${path}`,
    ...(type === "get" || type === "delete" ? {} : { data }),
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function frontPing(url, data) {
  try {
    const response = await axios.post(`${apiBase}/${url.replace(/^\/+/, "")}`, data);
    return response.data;
  } catch (error) {
    return { error: true, message: error.message };
  }
}
