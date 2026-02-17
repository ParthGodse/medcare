import React from 'react';

const PatientCard = ({ patient }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 bg-linear-to-r from-blue-50 to-blue-100 border-b-4 border-blue-600">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{patient.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">MRN:</span> {patient.mrn}
              </p>
              <p>
                <span className="font-medium">Room:</span> {patient.room}
              </p>
              <p>
                <span className="font-medium">DOB:</span> {patient.dob}
              </p>
              <p>
                <span className="font-medium">Code Status:</span> {patient.code_status}
              </p>
            </div>
          </div>
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="shrink-0">
              <span className="bg-red-100 text-red-800 text-sm font-semibold px-4 py-2 rounded-full inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Allergy: {patient.allergies.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCard;