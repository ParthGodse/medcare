import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import Modal from '../components/Modal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchPatients();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Patient?',
      message: `Are you sure you want to delete ${patientName}?\n\nThis will permanently delete:\n• Patient record\n• All shifts\n• All handoffs\n• All entries\n\nThis action cannot be undone.`,
      onConfirm: async () => {
        // Close confirm modal first
        setModal({ ...modal, isOpen: false });
        
        try {
          const response = await fetch(`http://localhost:8000/patients/${patientId}/shifts`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete patient');
          }

          // Refresh patients list
          await fetchPatients();

          // Show success modal
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Patient Deleted',
            message: `${patientName} has been successfully deleted.`,
            onConfirm: null
          });
          
        } catch (error) {
          console.error('Error deleting patient:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Delete Failed',
            message: `Failed to delete patient: ${error.message}`,
            onConfirm: null
          });
        }
      }
    });
  };

  const createDemoPatient = async () => {
    try {
      const demoPatient = {
        mrn: 'MRN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: 'John Doe',
        dob: '1958-03-15',
        room: '302-A',
        allergies: ['Penicillin'],
        code_status: 'Full Code'
      };
      const response = await patientsAPI.create(demoPatient);
      navigate(`/patient/${response.data.id}`);
    } catch (error) {
      console.error('Error creating patient:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to create demo patient. Please try again.',
        onConfirm: null
      });
    }
  };

  const getCurrentShift = () => {
    const hour = currentTime.getHours();
    if (hour >= 7 && hour < 19) {
      return {
        name: 'Day Shift',
        time: '7:00 AM - 7:00 PM',
        color: 'green',
      };
    } else {
      return {
        name: 'Night Shift',
        time: '7:00 PM - 7:00 AM',
        color: 'purple',
      };
    }
  };

  const currentShift = getCurrentShift();
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-indigo-50 relative">
      {/* Purple Tint Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-150 h-150 bg-purple-100 rounded-full"></div>
        <div className="absolute -bottom-60 -left-60 w-150 h-150 bg-indigo-200 rounded-full"></div>
        <div className="absolute top-1/3 left-1/3 w-100 h-100 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <header className="bg-white shadow-md relative border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-indigo-600!">
                  MedSync
                </h1>
                <p className="text-gray-600 text-sm mt-1 font-medium">Smart Clinical Handoff System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white border-2 border-purple-200 px-5 py-3 rounded-2xl shadow-sm">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  currentShift.color === 'green' ? 'bg-green-500' : 'bg-purple-500'
                } shadow-lg`}></div>
                <span className="text-gray-700 text-sm font-semibold">
                  {currentShift.name}
                </span>
              </div>
              <div className="text-gray-700 text-right hidden lg:block">
                <p className="text-sm font-bold">Nurse Demo</p>
                <p className="text-xs text-gray-500 font-medium">{currentShift.time}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Search and Actions Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search patients by name, MRN, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all shadow-sm bg-white"
            />
          </div>

          <button
            onClick={createDemoPatient}
            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white! font-bold rounded-2xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Demo Patient
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Total Patients</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {patients.length}
                </p>
              </div>
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Active Shifts</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {patients.filter(p => p.active_shift_id).length}
                </p>
              </div>
              <div className="bg-green-500 p-4 rounded-2xl shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Pending Handoffs</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {patients.filter(p => p.handoff_status === 'generated').length}
                </p>
              </div>
              <div className="bg-orange-500 p-4 rounded-2xl shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">
              My Patients
            </h2>
            <span className="text-sm text-gray-600 bg-purple-50 px-4 py-1.5 rounded-full font-semibold border border-purple-200">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
              <p className="text-gray-500 mt-4 font-medium">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-purple-100 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-14 h-14 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {searchQuery ? 'No patients found' : 'No patients assigned'}
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first patient'}
              </p>
              {!searchQuery && (
                <button
                  onClick={createDemoPatient}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Your First Patient
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-lg transition-all bg-white relative"
                >
                  <div className="flex items-start justify-between">
                    <div 
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      className="flex items-start gap-4 flex-1 cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="bg-indigo-600 rounded-2xl w-16 h-16 flex items-center justify-center shrink-0 shadow-md">
                        <span className="text-white font-bold text-xl">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {patient.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <span className="font-semibold">MRN:</span> {patient.mrn}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                            <span className="font-semibold">Room:</span> {patient.room}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                            <span className="font-semibold">{patient.code_status}</span>
                          </div>
                        </div>

                        {patient.allergies && patient.allergies.length > 0 && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm border border-red-200">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                              Allergy: {patient.allergies.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Arrow and Delete Button */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <svg 
                        onClick={() => navigate(`/patient/${patient.id}`)}
                        className="w-7 h-7 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all cursor-pointer" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                      </svg>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePatient(patient.id, patient.name);
                        }}
                        className="p-2 text-red-400 bg-red-50 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
                        title="Delete patient"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default Dashboard;