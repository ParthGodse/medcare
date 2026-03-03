import React, { useState } from 'react';
import PublishModal from './PublishModal';

const HandoffSummary = ({ handoff, onPublish }) => {
  const [showPublishModal, setShowPublishModal] = useState(false);

  if (!handoff) {
    return (
      <div className="p-4">
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-gray-500 text-lg font-medium">No handoff generated yet</p>
          <p className="text-gray-400 text-sm mt-2">Click the blue button to generate a summary</p>
        </div>
      </div>
    );
  }

  const handlePublishClick = () => {
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    await onPublish();
    setShowPublishModal(false);
  };

  return (
    <div className="p-4 pb-24">
      <div className="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
        <p className="text-sm text-indigo-800">
          <strong>💡 Auto-generated summary.</strong> Review carefully before publishing.
        </p>
      </div>

      {handoff.critical_items.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-md p-5 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
            CRITICAL ITEMS
          </h3>
          <ul className="space-y-2">
            {handoff.critical_items.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-gray-800">
                <span className="text-red-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {handoff.stable_items.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-md p-5 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
            STABLE / ROUTINE
          </h3>
          <ul className="space-y-2">
            {handoff.stable_items.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-gray-800">
                <span className="text-green-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {handoff.pending_tasks.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-md p-5 border-l-4 border-orange-500">
          <h3 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
            PENDING / FOLLOW-UP
          </h3>
          <ul className="space-y-2">
            {handoff.pending_tasks.map((task, idx) => (
              <li key={idx} className="flex gap-2 text-gray-800">
                <span className="text-orange-600 font-bold">•</span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {handoff.narrative && (
        <div className="mb-6 bg-linear-to-r from-purple-50 to-blue-50 rounded-2xl shadow-md p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            Narrative Summary
          </h3>
          <p className="text-gray-800 leading-relaxed">{handoff.narrative}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Print
        </button>
        <button
          onClick={handlePublishClick}
          className="flex-1 py-4 bg-indigo-600 text-white! font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"/>
          </svg>
          Publish Handoff
        </button>
      </div>

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handleConfirmPublish}
        handoff={handoff}
      />
    </div>
  );
};

export default HandoffSummary;