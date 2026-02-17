import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const createDemoPatient = async () => {
    try {
      const demoPatient = {
        mrn: 'MRN' + Math.random().toString(36).substr(2, 9),
        name: 'Sarah Johnson',
        dob: '1958-03-15',
        room: '302-A',
        allergies: ['Penicillin'],
        code_status: 'Full Code'
      };
      const response = await patientsAPI.create(demoPatient);
      navigate(`/patient/${response.data.id}`);
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold text-white!">ShiftSync Dashboard</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">My Patients</h2>
          <button
            onClick={createDemoPatient}
            className="px-4 py-2 bg-blue-600 text-white! rounded-lg hover:bg-blue-700"
          >
            + Demo Patient
          </button>
        </div>

        <div className="grid gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patient/${patient.id}`)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{patient.name}</h3>
                  <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                  <p className="text-sm text-gray-600">Room {patient.room}</p>
                </div>
                {patient.allergies.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    ⚠️ {patient.allergies.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}

          {patients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No patients assigned</p>
              <p className="text-sm">Click "Demo Patient" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;