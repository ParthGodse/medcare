import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm' }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/30 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-indigo-500/50 max-w-md w-full mx-4 p-6 transform transition-all">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess && (
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          )}
          {isError && (
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          )}
          {isConfirm && (
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          {isConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 bg-red-600 text-white! font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;