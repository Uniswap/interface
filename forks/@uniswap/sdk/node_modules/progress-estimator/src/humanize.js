'use strict';

const humanizeActual = msActual => {
  let unit;
  if (msActual < 1000) {
    msActual = Math.round(msActual);
    unit = 'ms';
  } else if (msActual < 60000) {
    msActual = (msActual / 1000).toFixed(1);
    unit = 'secs';
  } else if (msActual < 3600000) {
    msActual = (msActual / 60000).toFixed(1);
    unit = 'mins';
  } else {
    msActual = (msActual / 3600000).toFixed(1);
    unit = 'hours';
  }

  if (msActual % 1 === 0) {
    return `${Math.round(msActual)} ${unit}`;
  } else {
    return `${msActual} ${unit}`;
  }
};

const humanizeRemaining = (msElapsed, msEstimated) => {
  let unit;
  if (msEstimated < 1000) {
    msElapsed = Math.round(msElapsed);
    msEstimated = Math.round(msEstimated);
    unit = 'ms';
  } else if (msEstimated < 60000) {
    msElapsed = (msElapsed / 1000).toFixed(1);
    msEstimated = (msEstimated / 1000).toFixed(1);
    unit = 's';
  } else if (msEstimated < 3600000) {
    msElapsed = (msElapsed / 60000).toFixed(1);
    msEstimated = (msEstimated / 60000).toFixed(1);
    unit = 'm';
  } else {
    msElapsed = (msElapsed / 3600000).toFixed(1);
    msEstimated = (msEstimated / 3600000).toFixed(1);
    unit = 'h';
  }

  return `${msElapsed}${unit}, estimated ${msEstimated}${unit}`;
};

module.exports = {
  humanizeActual,
  humanizeRemaining
};
