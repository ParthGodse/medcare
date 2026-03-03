import React, { useState } from 'react';
import Toast from './Toast';

const MedicationList = ({ medications, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [newMed, setNewMed] = useState({
    medication: '',
    action: 'started',
    dose: '',
    time: '',
    reason: '',
    previousDose: ''
  });
  
  const [errors, setErrors] = useState({
    medication: false,
    dose: false,
    reason: false
  });

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleAdd = () => {
    // Reset errors
    const newErrors = {
      medication: false,
      dose: false,
      reason: false
    };

    // Validate medication name
    if (!newMed.medication.trim()) {
      newErrors.medication = true;
      showToast('Please enter medication name', 'error');
      setErrors(newErrors);
      setTimeout(() => setErrors({ medication: false, dose: false, reason: false }), 3000);
      return;
    }

    // Validate dose (required for started, increased, decreased)
    if ((newMed.action === 'started' || newMed.action === 'increased' || newMed.action === 'decreased') && !newMed.dose.trim()) {
      newErrors.dose = true;
      showToast('Please enter dose', 'error');
      setErrors(newErrors);
      setTimeout(() => setErrors({ medication: false, dose: false, reason: false }), 3000);
      return;
    }

    // Validate reason (required for held or discontinued)
    if ((newMed.action === 'held' || newMed.action === 'discontinued') && !newMed.reason.trim()) {
      newErrors.reason = true;
      showToast('Please enter reason for holding/discontinuing medication', 'error');
      setErrors(newErrors);
      setTimeout(() => setErrors({ medication: false, dose: false, reason: false }), 3000);
      return;
    }

    const medEntry = {
      entry_type: 'med_change',
      data: {
        medication: newMed.medication,
        action: newMed.action,
        dose: newMed.dose,
        time: newMed.time,
        reason: newMed.reason,
        previousDose: newMed.previousDose || ''
      },
      is_critical: true
    };

    console.log('Adding medication entry:', medEntry);
    
    onAdd(medEntry);
    
    setNewMed({ medication: '', action: 'started', dose: '', time: '', reason: '', previousDose: '' });
    setShowForm(false);
    setErrors({ medication: false, dose: false, reason: false });
    showToast('✓ Medication change added', 'success');
  };

  const handleInputChange = (field, value) => {
    setNewMed({ ...newMed, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  // Helper function to get the correct styling based on action
  const getActionStyle = (action) => {
    switch(action) {
      case 'started':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          icon: '✓',
          iconColor: 'text-green-600',
          label: 'Started'
        };
      case 'held':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          icon: '⏸',
          iconColor: 'text-yellow-600',
          label: 'Held'
        };
      case 'increased':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          icon: '↑',
          iconColor: 'text-blue-600',
          label: 'Increased'
        };
      case 'decreased':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-500',
          icon: '↓',
          iconColor: 'text-orange-600',
          label: 'Decreased'
        };
      case 'discontinued':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          icon: '×',
          iconColor: 'text-red-600',
          label: 'Discontinued'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-500',
          icon: 'ℹ️',
          iconColor: 'text-gray-600',
          label: action
        };
    }
  };

  return (
    <>
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Medication Changes</h3>

        <div className="space-y-3 mb-3">
          {medications.map((med, idx) => {
            const style = getActionStyle(med.data.action);
            
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${style.bgColor} ${style.borderColor}`}
              >
                <span className={`text-xl mt-1 ${style.iconColor}`}>
                  {style.icon}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {style.label} {med.data.medication}
                  </p>
                  {med.data.dose && (
                    <p className="text-sm text-gray-600">
                      {med.data.dose}
                      {med.data.time && ` @ ${med.data.time}`}
                    </p>
                  )}
                  {med.data.reason && (
                    <p className="text-sm text-gray-600">
                      Reason: {med.data.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            + Add Medication Change
          </button>
        ) : (
          <div className="border-2 border-indigo-600 rounded-xl p-4 bg-white">
            <h4 className="font-semibold text-gray-800 mb-3">Add Medication Change</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Vancomycin"
                  value={newMed.medication}
                  onChange={(e) => handleInputChange('medication', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.medication
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-indigo-600'
                  }`}
                />
                {errors.medication && (
                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Medication name is required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action *
                </label>
                <select
                  value={newMed.action}
                  onChange={(e) => handleInputChange('action', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                >
                  <option value="started">Started</option>
                  <option value="held">Held</option>
                  <option value="increased">Increased</option>
                  <option value="decreased">Decreased</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose {(newMed.action === 'started' || newMed.action === 'increased' || newMed.action === 'decreased') && '*'}
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1g IV"
                  value={newMed.dose}
                  onChange={(e) => handleInputChange('dose', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.dose
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-indigo-600'
                  }`}
                />
                {errors.dose && (
                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Dose is required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={newMed.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {(newMed.action === 'held' || newMed.action === 'discontinued') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Hypotension"
                    value={newMed.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all ${
                      errors.reason
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-indigo-600'
                    }`}
                  />
                  {errors.reason && (
                    <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Reason is required when holding/discontinuing medication
                    </p>
                  )}
                </div>
              )}

              {(newMed.action === 'increased' || newMed.action === 'decreased') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Dose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20mg"
                    value={newMed.previousDose || ''}
                    onChange={(e) => handleInputChange('previousDose', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdd}
                className="flex-1 py-2 bg-indigo-600 text-white! font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Medication
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewMed({ medication: '', action: 'started', dose: '', time: '', reason: '', previousDose: '' });
                  setErrors({ medication: false, dose: false, reason: false });
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default MedicationList;