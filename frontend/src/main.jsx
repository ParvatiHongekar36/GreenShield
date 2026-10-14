import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import MetricDetail from './pages/MetricDetail.jsx';
import Login from './pages/Login.jsx';
import RequireAuth from './components/RequireAuth.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><App /></RequireAuth>} />
        <Route path="/metric/:metric" element={<RequireAuth><MetricDetail /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);