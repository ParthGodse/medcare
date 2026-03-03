import React, { useState } from 'react';
import { formatTime } from '../utils/helpers';
import Toast from './Toast';

const NotesSection = ({ notes, onAdd }) => {
  const [noteText, setNoteText] = useState('');
  const [showError, setShowError] = useState(false);
  
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
    if (!noteText.trim()) {
      setShowError(true);
      showToast('Please enter a note', 'error');
      
      // Auto-clear error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    onAdd({
      entry_type: 'note',
      data: { 
        text: noteText.trim()
      },
      is_critical: false
    });
    
    setNoteText('');
    setShowError(false);
    showToast('Note added successfully', 'success');
  };
  
  return (
    <>
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Shift Notes</h3>

        <div className="space-y-2 mb-3">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes added yet</p>
          ) : (
            notes.map((note, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">
                  {formatTime(note.timestamp)}
                </p>
                <p className="text-sm text-gray-800">{note.data.text}</p>
              </div>
            ))
          )}
        </div>

        <textarea
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value);
            if (showError) setShowError(false); // Clear error when user starts typing
          }}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none text-gray-800 transition-all ${
            showError 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:border-indigo-600'
          }`}
          rows="3"
          placeholder="Add a note... (e.g., Patient febrile with chills)"
        />

        {showError && (
          <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            Note text is required
          </p>
        )}

        <button
          onClick={handleAdd}
          className="mt-3 w-full py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Add Timestamped Note
        </button>
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

export default NotesSection;