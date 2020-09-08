import chalk from 'chalk';
import progressEstimator, { configure, logProgress, ChalkTheme } from '..';

// Test promises
const stringPromise = new Promise<string>(resolve => resolve('hello'));
const numberPromise = new Promise<number>(resolve => resolve(10));

// Chalk theme
const chalkTheme = chalk.constructor() as ChalkTheme;
chalkTheme.asciiCompleted = chalkTheme;
chalkTheme.asciiInProgress = chalkTheme;
chalkTheme.estimate = chalkTheme;
chalkTheme.estimateExceeded = chalkTheme;
chalkTheme.label = chalkTheme;
chalkTheme.percentage = chalkTheme;
chalkTheme.progressBackground = chalkTheme;
chalkTheme.progressForeground = chalkTheme;

// Check `logProgress`
const resultOne: Promise<string> = progressEstimator(
  stringPromise,
  'This promise has no initial estimate'
);
const resultTwo: Promise<number> = progressEstimator(
  numberPromise,
  'This promise is initially estimated to take 1 second',
  1000
);
const resultThree: Promise<number> = logProgress(numberPromise, 'Valid export');

// Check `configure`
configure({
  spinner: { interval: 100, frames: ['.', ''] }
});
configure({
  storagePath: 'path/to/dir'
});
configure({
  theme: chalkTheme
});
configure({
  spinner: { interval: 100, frames: ['.', ''] },
  storagePath: 'path/to/dir',
  theme: chalkTheme
});
progressEstimator.configure({
  spinner: { interval: 100, frames: ['.', ''] },
  storagePath: 'path/to/dir',
  theme: chalkTheme
});
