import React, { useState } from 'react';

const ShiftHistoryModal = ({ isOpen, onClose, shifts, onDelete, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (handoffId, shiftId) => {
    if (!confirm('Are you sure you want to delete this shift and handoff? This action cannot be undone.')) {
      return;
    }

    setDeletingId(handoffId);
    try {
      await onDelete(handoffId);
      alert('✅ Shift deleted successfully');
      await onRefresh();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('❌ Error deleting shift');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter to only show PUBLISHED shifts (not active ones)
  const publishedShifts = shifts.filter(s => s.shift.status === 'published');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">Shift History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {publishedShifts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="font-medium">No completed shifts</p>
              <p className="text-sm mt-2">Published handoffs will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {publishedShifts.map((shiftData, idx) => {
                const { shift, handoff } = shiftData;
                const isLatest = idx === 0;
                const isDeleting = deletingId === handoff?.id;

                return (
                  <div
                    key={shift.id}
                    className={`border-2 rounded-xl p-5 ${
                      isLatest ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    } ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-800">
                            {shift.nurse_name}
                          </h3>
                          {isLatest && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              Latest
                            </span>
                          )}
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                            Published
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Start:</span>{' '}
                            {new Date(shift.start_time).toLocaleString()}
                          </p>
                          {shift.end_time && (
                            <p>
                              <span className="font-medium">End:</span>{' '}
                              {new Date(shift.end_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {handoff && (
                        <button
                          onClick={() => handleDelete(handoff.id, shift.id)}
                          disabled={isDeleting}
                          className="ml-4 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                          {isDeleting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              <span className="text-sm">Deleting...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                              <span className="text-sm">Delete</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {handoff && (
                      <div className="mt-4 space-y-3">
                        {handoff.critical_items && handoff.critical_items.length > 0 && 
                         handoff.critical_items[0] !== "No critical alerts" && 
                         handoff.critical_items[0] !== "No critical alerts this shift" && (
                          <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                            <h4 className="font-semibold text-red-700 text-sm mb-2">
                              🔴 Critical
                            </h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              {handoff.critical_items.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {handoff.pending_tasks && handoff.pending_tasks.length > 0 && 
                         handoff.pending_tasks[0] !== "No pending tasks" && 
                         handoff.pending_tasks[0] !== "All tasks completed" && (
                          <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                            <h4 className="font-semibold text-orange-700 text-sm mb-2">
                              ⏰ Pending
                            </h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                              {handoff.pending_tasks.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {handoff.narrative && 
                         handoff.narrative !== "No additional notes documented this shift." && 
                         handoff.narrative !== "No significant notes recorded this shift." && (
                          <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                            <h4 className="font-semibold text-purple-700 text-sm mb-2">
                              📋 Summary
                            </h4>
                            <p className="text-sm text-gray-700">{handoff.narrative}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftHistoryModal;