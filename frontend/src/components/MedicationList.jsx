import React, { useState } from 'react';

const MedicationList = ({ medications, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [newMed, setNewMed] = useState({
    medication: '',
    action: 'started',
    dose: '',
    time: '',
    reason: ''
  });

  const handleAdd = () => {
  if (!newMed.medication) {
    alert('Please enter medication name');
    return;
  }

  const medEntry = {
    entry_type: 'med_change',
    data: {
      medication: newMed.medication,
      action: newMed.action,  // Make sure this is exactly 'started', 'held', 'increased', etc.
      dose: newMed.dose,
      time: newMed.time,
      reason: newMed.reason,
      previousDose: newMed.previousDose || ''
    },
    is_critical: true
  };

  console.log('Adding medication entry:', medEntry); // DEBUG
  
  onAdd(medEntry);
  
  setNewMed({ medication: '', action: 'started', dose: '', time: '', reason: '', previousDose: '' });
  setShowForm(false);
  alert('✓ Medication change added');
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
              <button 
                onClick={() => {
                  // Remove this medication
                  const updatedMeds = medications.filter((_, i) => i !== idx);
                  // You'd need to pass a remove handler from parent
                }}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
        >
          + Add Medication Change
        </button>
      ) : (
        <div className="border-2 border-blue-600 rounded-xl p-4 bg-white">
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
                onChange={(e) => setNewMed({ ...newMed, medication: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action *
              </label>
              <select
                value={newMed.action}
                onChange={(e) => setNewMed({ ...newMed, action: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
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
                Dose {newMed.action !== 'held' && '*'}
              </label>
              <input
                type="text"
                placeholder="e.g., 1g IV"
                value={newMed.dose}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={newMed.time}
                onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
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
                  onChange={(e) => setNewMed({ ...newMed, reason: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
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
                  onChange={(e) => setNewMed({ ...newMed, previousDose: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Medication
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewMed({ medication: '', action: 'started', dose: '', time: '', reason: '' });
              }}
              className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationList;