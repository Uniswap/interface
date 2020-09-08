'use strict';

const chalk = require('chalk');

// Color support is limited:
// https://github.com/jbnicolai/ansi-256-colors
const colors = {
  black: '#171717',
  gray: '#757575',
  green: '#00de6d',
  darkGreen: '#007272',
  red: '#cf000b',
  yellow: '#ffdd00',
  white: '#ffffff'
};

const theme = chalk.constructor();
theme.asciiCompleted = theme.hex(colors.green);
theme.asciiInProgress = theme.hex(colors.yellow);
theme.estimate = theme.hex(colors.gray);
theme.estimateExceeded = theme.hex(colors.red);
theme.label = theme;
theme.percentage = theme;
theme.progressBackground = theme.bgHex(colors.darkGreen).hex(colors.white);
theme.progressForeground = theme.bgHex(colors.green).hex(colors.black);

module.exports = theme;
