import React, { useState } from 'react';
import { formatTime } from '../utils/helpers';

const NotesSection = ({ notes, onAdd }) => {
  const [noteText, setNoteText] = useState('');

  const handleAdd = () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
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
    alert('✓ Note added successfully');
  };

  return (
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
        onChange={(e) => setNoteText(e.target.value)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none resize-none text-gray-800"
        rows="3"
        placeholder="Add a note... (e.g., Patient febrile with chills)"
      />

      <button
        onClick={handleAdd}
        className="mt-3 w-full py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Add Timestamped Note
      </button>
    </div>
  );
};

export default NotesSection;