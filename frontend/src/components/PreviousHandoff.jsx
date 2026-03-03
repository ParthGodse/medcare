import React from 'react';

const PreviousHandoff = ({ handoffData, onViewHistory }) => {
  if (!handoffData) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6 shadow-sm">
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-gray-500 font-medium">No previous handoff</p>
          <p className="text-sm text-gray-400 mt-1">This is the first shift for this patient</p>
        </div>
      </div>
    );
  }

  const { shift, handoff } = handoffData;

  return (
    <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-indigo-200 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            Previous Shift Handoff
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            From: <span className="font-semibold">{shift.nurse_name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Ended: {new Date(shift.end_time).toLocaleString()}
          </p>
        </div>
        <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
          Last Shift
        </span>
      </div>

      <div className="space-y-4">
        {handoff.critical_items && handoff.critical_items.length > 0 && handoff.critical_items[0] !== "No critical alerts" && (
          <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 shadow-sm">
            <h4 className="font-bold text-red-700 text-sm mb-2">CRITICAL ITEMS</h4>
            <ul className="space-y-1 text-sm">
              {handoff.critical_items.map((item, idx) => (
                <li key={idx} className="text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {handoff.pending_tasks && handoff.pending_tasks.length > 0 && handoff.pending_tasks[0] !== "No pending tasks" && handoff.pending_tasks[0] !== "All tasks completed" && handoff.pending_tasks[0] !== "No outstanding tasks identified" && (
          <div className="bg-white rounded-xl p-4 border-l-4 border-orange-500 shadow-sm">
            <h4 className="font-bold text-orange-700 text-sm mb-2">PENDING TASKS</h4>
            <ul className="space-y-1 text-sm">
              {handoff.pending_tasks.map((task, idx) => (
                <li key={idx} className="text-gray-700">• {task}</li>
              ))}
            </ul>
          </div>
        )}

        {handoff.stable_items && handoff.stable_items.length > 0 && (
          <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
            <h4 className="font-bold text-green-700 text-sm mb-2">STABLE</h4>
            <ul className="space-y-1 text-sm">
              {handoff.stable_items.map((item, idx) => (
                <li key={idx} className="text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {handoff.narrative && handoff.narrative !== "No additional notes documented this shift." && (
          <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500 shadow-sm">
            <h4 className="font-bold text-purple-700 text-sm mb-2">NOTES</h4>
            <p className="text-sm text-gray-700">{handoff.narrative}</p>
          </div>
        )}
      </div>

      <button 
        onClick={onViewHistory}
        className="mt-4 w-full py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        View Full Shift History
      </button>
    </div>
  );
};

export default PreviousHandoff;