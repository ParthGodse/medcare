import React, { useState, useEffect } from 'react';
import { isAbnormalVital } from '../utils/helpers';

const VitalsForm = ({ onSubmit, entries, showError = false }) => {
  const [vitals, setVitals] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    heart_rate: '',
    temperature: '',
    o2_saturation: '',
    o2_delivery: 'Room Air',
  });

  const handleChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  // Helper functions for abnormal detection
  const isAbnormalBP = (systolic) => {
    const val = parseFloat(systolic);
    return !isNaN(val) && (val < 90 || val > 140);
  };

  const isAbnormalHR = (hr) => {
    const val = parseFloat(hr);
    return !isNaN(val) && (val < 60 || val > 100);
  };

  const isAbnormalTemp = (temp) => {
    const val = parseFloat(temp);
    return !isNaN(val) && val > 38.0;
  };

  const isAbnormalO2 = (o2) => {
    const val = parseFloat(o2);
    return !isNaN(val) && val < 95;
  };

  const copyFromPrevious = () => {
    // Find the last vitals entry
    const vitalEntries = entries.filter(e => e.entry_type === 'vitals');
    
    if (vitalEntries.length === 0) {
      alert('No previous vitals to copy');
      return;
    }

    // Get the most recent vitals
    const lastVitals = vitalEntries[vitalEntries.length - 1];
    
    if (lastVitals && lastVitals.data) {
      setVitals({
        bp_systolic: lastVitals.data.bp_systolic || '',
        bp_diastolic: lastVitals.data.bp_diastolic || '',
        heart_rate: lastVitals.data.heart_rate || '',
        temperature: lastVitals.data.temperature || '',
        o2_saturation: lastVitals.data.o2_saturation || '',
        o2_delivery: lastVitals.data.o2_delivery || 'Room Air',
      });
      alert('✓ Previous vitals copied');
    } else {
      alert('No previous vitals found');
    }
  };

  const handleSubmit = () => {
    // Validate that we have at least BP or HR or Temp
    if (!vitals.bp_systolic && !vitals.heart_rate && !vitals.temperature) {
      alert('Please enter at least Blood Pressure, Heart Rate, or Temperature');
      return;
    }

    const isCritical = 
      isAbnormalBP(vitals.bp_systolic) ||
      isAbnormalHR(vitals.heart_rate) ||
      isAbnormalTemp(vitals.temperature) ||
      isAbnormalO2(vitals.o2_saturation);

    onSubmit({
      entry_type: 'vitals',
      data: vitals,
      is_critical: isCritical
    });

    // Show success message
    alert('✓ Vitals saved successfully');
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border-2 shadow-sm transition-all ${
      showError ? 'border-red-500' : 'border-gray-200'
    }`}>
      {showError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span className="text-sm font-semibold text-red-700">
            Please fill out all vitals before generating handoff
          </span>
        </div>
      )}
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-indigo-600">Current Vitals</h3>
        <button 
          onClick={copyFromPrevious}
          className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
          </svg>
          Copy Previous
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blood Pressure */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Pressure *
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="120"
              value={vitals.bp_systolic}
              onChange={(e) => handleChange('bp_systolic', e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-600 focus:outline-none"
            />
            <span className="font-bold text-gray-500">/</span>
            <input
              type="number"
              placeholder="80"
              value={vitals.bp_diastolic}
              onChange={(e) => handleChange('bp_diastolic', e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-sm text-gray-600 ml-2">mmHg</span>
          </div>
          {isAbnormalBP(vitals.bp_systolic) && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {parseFloat(vitals.bp_systolic) < 90 ? 'Hypotension' : 'Hypertension'}
            </p>
          )}
        </div>

        {/* Heart Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="78"
              value={vitals.heart_rate}
              onChange={(e) => handleChange('heart_rate', e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-sm text-gray-600">bpm</span>
          </div>
          {isAbnormalHR(vitals.heart_rate) && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {parseFloat(vitals.heart_rate) < 60 ? 'Bradycardia' : 'Tachycardia'}
            </p>
          )}
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Temperature *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              step="0.1"
              placeholder="37.0"
              value={vitals.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-sm text-gray-600">°C</span>
          </div>
          {isAbnormalTemp(vitals.temperature) && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Febrile
            </p>
          )}
        </div>

        {/* O2 Saturation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">O2 Saturation *</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="98"
              value={vitals.o2_saturation}
              onChange={(e) => handleChange('o2_saturation', e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
          {isAbnormalO2(vitals.o2_saturation) && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Hypoxic
            </p>
          )}
        </div>

        {/* O2 Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">O2 Delivery</label>
          <select
            value={vitals.o2_delivery}
            onChange={(e) => handleChange('o2_delivery', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium focus:border-indigo-600 focus:outline-none"
          >
            <option>Room Air</option>
            <option>2L NC</option>
            <option>4L NC</option>
            <option>Non-Rebreather</option>
            <option>High Flow</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full py-3 bg-indigo-600 text-white! font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Save Vitals
      </button>
    </div>
    </div>
  );
};

export default VitalsForm;