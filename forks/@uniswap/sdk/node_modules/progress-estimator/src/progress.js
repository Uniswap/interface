'use strict';

const getProgressBar = (percentage, theme, size = 20) => {
  percentage = Math.max(0, Math.min(0.99, percentage));

  const template = ` ${Math.round(percentage * 100)}%`.padEnd(size);

  let string = '';
  for (let i = 0; i < size; i++) {
    const char = template.charAt(i);
    string +=
      percentage > 0 && i / size <= percentage
        ? theme.progressForeground(char)
        : theme.progressBackground(char);
  }

  return string;
};

module.exports = {
  getProgressBar
};
