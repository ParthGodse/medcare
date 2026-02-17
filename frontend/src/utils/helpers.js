export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const isAbnormalVital = (type, value) => {
  const ranges = {
    bp_systolic: { min: 90, max: 140 },
    bp_diastolic: { min: 60, max: 90 },
    heart_rate: { min: 60, max: 100 },
    temperature: { min: 36.1, max: 37.2 },
    o2_saturation: { min: 95, max: 100 },
  };

  const range = ranges[type];
  if (!range) return false;
  
  return value < range.min || value > range.max;
};

export const getVitalStatus = (type, value) => {
  if (isAbnormalVital(type, value)) {
    return { color: 'red', message: '⚠️ Abnormal' };
  }
  return { color: 'green', message: '✓ Normal' };
};