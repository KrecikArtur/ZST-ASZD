import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Plan from './Plan';
import Settings from './Settings';
import RequireAuth from './components/RequireAuth';
import Toaster from './components/Toaster';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}/>
        <Route path="/planedit/:option" element={<RequireAuth><Plan /></RequireAuth>} />
        <Route path="/options" element={<RequireAuth><Settings /></RequireAuth>}/>
        {/* <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}/> */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;