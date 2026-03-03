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
import Modal from '../components/Modal'; 

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
  const [generatingHandoff, setGeneratingHandoff] = useState(false); 
  const [showValidationError, setShowValidationError] = useState(false);
  const [modal, setModal] = useState({
  isOpen: false,
  type: 'success',
  title: '',
  message: '',
  onConfirm: null
});
  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      const patientResponse = await patientsAPI.getById(patientId);
      setPatient(patientResponse.data);

      const historyResponse = await patientsAPI.getShifts(patientId);
      setShiftHistory(historyResponse.data);

      const activeShift = historyResponse.data.find(
        s => s.shift.status === 'active' || s.shift.status === 'completed'
      );
      
      if (activeShift) {
        setShiftId(activeShift.shift.id);
        setHasActiveShift(true);
        
        const entriesResponse = await entriesAPI.getByShift(activeShift.shift.id);
        setEntries(entriesResponse.data);
        
        try {
          const handoffResponse = await handoffAPI.getByShift(activeShift.shift.id);
          if (handoffResponse.data) {
            setHandoff(handoffResponse.data);
          }
        } catch (error) {
          console.log('No handoff generated yet');
        }
      } else {
        setHasActiveShift(false);
      }

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
    // If this is vitals, delete old vitals first (replace with latest)
    if (entry.entry_type === 'vitals') {
      const existingVitals = entries.filter(e => e.entry_type === 'vitals');
      
      if (existingVitals.length > 0) {
        // Delete old vitals
        await fetch(`http://localhost:8000/shifts/${shiftId}/entries/vitals`, {
          method: 'DELETE',
        });
        console.log('Deleted old vitals, saving new ones');
      }
    }
    
    // Save the new entry
    const response = await entriesAPI.create(shiftId, entry);
    
    // Reload ALL entries from backend
    const entriesResponse = await entriesAPI.getByShift(shiftId);
    setEntries(entriesResponse.data);
    
    console.log('All entries after save:', entriesResponse.data);
    
  } catch (error) {
    console.error('Error adding entry:', error);
  }
};

  const handleGenerateSummary = async () => {
  // Check if there are any entries
  if (entries.length === 0) {
    setShowValidationError(true);
    setModal({
      isOpen: true,
      type: 'error',
      title: 'No Data Entered',
      message: 'Please enter at least some vitals, medications, or notes before generating a handoff.',
      onConfirm: null
    });
    setActiveTab('entry');
    
    // Auto-clear validation error after 5 seconds
    setTimeout(() => setShowValidationError(false), 5000);
    return;
  }

  // Check if there are vitals entries
  const hasVitals = entries.some(e => e.entry_type === 'vitals');
  
  if (!hasVitals) {
    setShowValidationError(true);
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Missing Vitals',
      message: 'Please enter at least one set of vitals before generating a handoff.\n\nVitals are required for clinical handoffs.',
      onConfirm: null
    });
    setActiveTab('entry');
    
    // Auto-clear validation error after 5 seconds
    setTimeout(() => setShowValidationError(false), 5000);
    return;
  }

  // Clear validation error if user had one before
  setShowValidationError(false);

  // Proceed with generation
  setGeneratingHandoff(true);
  try {
    const response = await handoffAPI.generate(shiftId);
    setHandoff(response.data);
    setActiveTab('summary');
    
    setModal({
      isOpen: true,
      type: 'success',
      title: 'Handoff Generated',
      message: 'AI handoff summary has been generated successfully!',
      onConfirm: null
    });
  } catch (error) {
    console.error('Error generating handoff:', error);
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Generation Failed',
      message: 'Error generating handoff. Please try again.',
      onConfirm: null
    });
  } finally {
    setGeneratingHandoff(false);
  }
};

  const handlePublish = async () => {
  if (!handoff || !handoff.id) {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error',
      message: 'Please generate a handoff first',
      onConfirm: null
    });
    return;
  }

  try {
    const response = await handoffAPI.publish(handoff.id);
    
    setModal({
      isOpen: true,
      type: 'success',
      title: 'Handoff Published',
      message: 'Handoff has been published successfully!',
      onConfirm: null
    });
    
    // Navigate after short delay
    setTimeout(() => {
      navigate('/');
    }, 1500);
  } catch (error) {
    console.error('Error publishing handoff:', error);
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Publish Failed',
      message: 'Error publishing handoff. Please try again.',
      onConfirm: null
    });
  }
};

  const handleDeleteHandoff = async (handoffId) => {
    try {
      await handoffAPI.delete(handoffId);
      await loadPatient();
    } catch (error) {
      console.error('Error deleting handoff:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading patient...</p>
        </div>
      </div>
    );
  }

  const medications = entries.filter(e => e.entry_type === 'med_change');
  const notes = entries.filter(e => e.entry_type === 'note');

  return (
    <div className="min-h-screen bg-white relative">
      {/* Purple Tint Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-150 h-150 bg-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-indigo-100 rounded-full opacity-15 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-md relative border-b border-gray-200 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 relative flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600! px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-2xl font-bold text-indigo-600!">MedSync</h1>
            <p className="text-xs text-gray-500 font-medium">Day Shift • 7:00 AM - 7:00 PM</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
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
            
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start New Shift</h2>
              <p className="text-gray-600 mb-6">
                {previousHandoff 
                  ? 'Review the previous handoff above, then start your shift' 
                  : 'No active shift for this patient. Start a new shift to begin documentation.'}
              </p>
              <button
                onClick={startNewShift}
                className="px-8 py-4 bg-indigo-600 text-white! font-bold rounded-2xl hover:bg-indigo-700 shadow-lg transition-all transform hover:-translate-y-0.5"
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

              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="flex border-b bg-white sticky top-0 z-10">
                  <button
                    onClick={() => setActiveTab('entry')}
                    className={`flex-1 py-4 font-semibold transition-colors ${
                      activeTab === 'entry'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Data Entry
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-4 font-semibold transition-colors ${
                      activeTab === 'summary'
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Summary
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'entry' ? (
                    <div className="space-y-6">
                      <VitalsForm onSubmit={handleAddEntry} entries={entries} showError={showValidationError} />
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
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-indigo-600 mb-4">Quick Actions</h3>
                
               <button
                onClick={handleGenerateSummary}
                disabled={generatingHandoff}
                className="w-full py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors mb-3 flex items-center justify-center gap-2 shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {generatingHandoff ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Generate Handoff</span>
                  </>
                )}
              </button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">Shift Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entries:</span>
                      <span className="font-semibold text-indigo-600">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medications:</span>
                      <span className="font-semibold text-indigo-600">{medications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-semibold text-indigo-600">{notes.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
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

      {/* Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={handleGenerateSummary}
          className="bg-indigo-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
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

export default PatientView;