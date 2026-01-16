import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from "./components/Login-Sys";
import Login from './Login';
import Dashboard from './Dashboard';
import PlanEdit from './PlanEdit';
import Settings from './Settings';
import Toaster from './components/Toaster';
import Register from './Register';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/register" element={<Register />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}/>
        <Route path="/planedit/:option" element={<RequireAuth><PlanEdit /></RequireAuth>} />
        <Route path="/options" element={<RequireAuth><Settings /></RequireAuth>}/>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </Router>
  </React.StrictMode>
);