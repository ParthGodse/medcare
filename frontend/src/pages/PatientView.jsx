import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientCard from '../components/PatientCard';
import VitalsForm from '../components/VitalsForm';
import MedicationList from '../components/MedicationList';
import NotesSection from '../components/NotesSection';
import HandoffSummary from '../components/HandoffSummary';
import PreviousHandoff from '../components/PreviousHandoff';
import ShiftHistoryModal from '../components/ShiftHistoryModal';
import { patientsAPI, shiftsAPI, entriesAPI, handoffAPI } from '../services/api';

const PatientView = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [shiftId, setShiftId] = useState(null);
  const [activeTab, setActiveTab] = useState('entry');
  const [entries, setEntries] = useState([]);
  const [handoff, setHandoff] = useState(null);
  const [previousHandoff, setPreviousHandoff] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasActiveShift, setHasActiveShift] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
  try {
    // Load patient info
    const patientResponse = await patientsAPI.getById(patientId);
    setPatient(patientResponse.data);

    // Load shift history
    const historyResponse = await patientsAPI.getShifts(patientId);
    setShiftHistory(historyResponse.data);

    // Check if there's an active (unpublished) shift
    const activeShift = historyResponse.data.find(
      s => s.shift.status === 'active' || s.shift.status === 'completed'
    );
    
    if (activeShift) {
      // Continue existing active shift
      setShiftId(activeShift.shift.id);
      setHasActiveShift(true);
      
      // Load entries for active shift
      const entriesResponse = await entriesAPI.getByShift(activeShift.shift.id);
      setEntries(entriesResponse.data);
      
      // Check if handoff exists for this shift
      try {
        const handoffResponse = await handoffAPI.getByShift(activeShift.shift.id);
        if (handoffResponse.data) {
          setHandoff(handoffResponse.data);
        }
      } catch (error) {
        // No handoff yet, that's okay
        console.log('No handoff generated yet');
      }
    } else {
      // No active shift
      setHasActiveShift(false);
    }

    // Load most recent published handoff (not active one)
    const publishedShifts = historyResponse.data.filter(
      s => s.shift.status === 'published' && s.handoff
    );
    
    if (publishedShifts.length > 0) {
      const latestPublished = publishedShifts[0];
      setPreviousHandoff(latestPublished);
    }

    setLoading(false);
  } catch (error) {
    console.error('Error loading patient:', error);
    setLoading(false);
  }
};

  const startNewShift = async () => {
    try {
      const shiftResponse = await shiftsAPI.create(patientId, 'Nurse Demo');
      setShiftId(shiftResponse.data.id);
      setHasActiveShift(true);
      setEntries([]);
      setHandoff(null);
      setActiveTab('entry');
    } catch (error) {
      console.error('Error starting shift:', error);
      alert('Error starting new shift');
    }
  };

  const handleAddEntry = async (entry) => {
    try {
      const response = await entriesAPI.create(shiftId, entry);
      setEntries([...entries, response.data]);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const response = await handoffAPI.generate(shiftId);
      setHandoff(response.data);
      setActiveTab('summary');
    } catch (error) {
      console.error('Error generating handoff:', error);
    }
  };

  const handlePublish = async () => {
    if (!handoff || !handoff.id) {
      alert('Please generate a handoff first');
      return;
    }

    try {
      const response = await handoffAPI.publish(handoff.id);
      alert(`✅ Handoff published successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Error publishing handoff:', error);
      alert('❌ Error publishing handoff. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleDeleteHandoff = async (handoffId) => {
  try {
    await handoffAPI.delete(handoffId);
    // Reload patient data after delete
    await loadPatient();
  } catch (error) {
    console.error('Error deleting handoff:', error);
    throw error;
  }
};

  const medications = entries.filter(e => e.entry_type === 'med_change');
  const notes = entries.filter(e => e.entry_type === 'note');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">ShiftSync</h1>
            <p className="text-xs opacity-90">Day Shift • 7:00 AM - 7:00 PM</p>
          </div>
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {patient && (
          <div className="mb-6">
            <PatientCard patient={patient} />
          </div>
        )}

        {!hasActiveShift ? (
          <div className="max-w-2xl mx-auto">
            {previousHandoff && (
              <PreviousHandoff 
                handoffData={previousHandoff} 
                onViewHistory={() => setShowHistoryModal(true)}
              />
            )}
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start New Shift</h2>
              <p className="text-gray-600 mb-6">
                {previousHandoff 
                  ? 'Review the previous handoff above, then start your shift' 
                  : 'No active shift for this patient. Start a new shift to begin documentation.'}
              </p>
              <button
                onClick={startNewShift}
                className="px-8 py-4 bg-blue-600 text-white! font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-colors"
              >
                Start Shift
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {previousHandoff && activeTab === 'entry' && (
                <PreviousHandoff 
                  handoffData={previousHandoff} 
                  onViewHistory={() => setShowHistoryModal(true)}
                />
              )}

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex border-b bg-white sticky top-0 z-10">
                  <button
                    onClick={() => setActiveTab('entry')}
                    className={`flex-1 py-3 font-medium transition-colors ${
                      activeTab === 'entry'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Data Entry
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-3 font-medium transition-colors ${
                      activeTab === 'summary'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Summary
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'entry' ? (
                    <div className="space-y-6">
                      <VitalsForm onSubmit={handleAddEntry} entries={entries} />
                      <MedicationList medications={medications} onAdd={handleAddEntry} />
                      <NotesSection notes={notes} onAdd={handleAddEntry} />
                    </div>
                  ) : (
                    <HandoffSummary handoff={handoff} onPublish={handlePublish} />
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                
                <button
                  onClick={handleGenerateSummary}
                  className="w-full py-3 bg-blue-600 text-white! font-semibold rounded-xl hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generate Handoff
                </button>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-700">Shift Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entries:</span>
                      <span className="font-semibold">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medications:</span>
                      <span className="font-semibold">{medications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-semibold">{notes.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-700">Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Enter vitals first</li>
                    <li>• Document med changes immediately</li>
                    <li>• Use timestamped notes for events</li>
                    <li>• Review summary before publishing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-6 right-6">
        <button
          onClick={handleGenerateSummary}
          className="bg-blue-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <ShiftHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        shifts={shiftHistory}
        onDelete={handleDeleteHandoff}
        onRefresh={loadPatient}
      />
    </div>
  );
};

export default PatientView;