// src/components/RequireAuth.js
import React from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, isTokenExpired, refreshAccessToken } from "./Login-Sys";

function RequireAuth({ children }) {
  return children;
  const access = getAccessToken();
  if (!access) {
    return <Navigate to="/login" replace />;
  }
  if (isTokenExpired(access)) {
    refreshAccessToken();
  }

  return children;
}

export default RequireAuth;