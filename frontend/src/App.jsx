import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientView from './pages/PatientView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient/:patientId" element={<PatientView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;