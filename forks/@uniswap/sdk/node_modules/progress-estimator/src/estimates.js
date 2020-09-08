'use strict';

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const getEstimate = (id, estimatedDuration, storagePath) => {
  const durations = getPreviousDurations(id, storagePath);

  if (durations.length < 3 && estimatedDuration) {
    durations.push(estimatedDuration);
  }

  if (durations.length > 0) {
    return (
      durations.reduce((total, current) => total + current, 0) /
      durations.length
    );
  } else {
    return estimatedDuration;
  }
};

const getPreviousDurations = (id, storagePath) => {
  const path = join(storagePath, id);
  if (existsSync(path)) {
    return readFileSync(path, 'utf8')
      .split('\n')
      .filter(line => line)
      .map(line => Number.parseInt(line, 10));
  }
  return [];
};

const updateEstimate = (id, duration, storagePath) => {
  if (!existsSync(storagePath)) {
    mkdirSync(storagePath);
  }

  const durations = getPreviousDurations(id, storagePath);
  durations.push(duration);

  if (durations.length > 10) {
    durations.shift();
  }

  const path = join(storagePath, id);
  writeFileSync(path, durations.join('\n'));
};

module.exports = {
  getEstimate,
  updateEstimate
};
