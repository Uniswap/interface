'use strict';

const { createHash } = require('crypto');

const { humanizeActual, humanizeRemaining } = require('./humanize');
const { getEstimate, updateEstimate } = require('./estimates');
const { getPercentageString, getProgressBar } = require('./progress');

const configureLogger = configuration => {
  const { logFunction, spinner, storagePath, theme } = configuration;

  return async (promise, label, options) => {
    let { estimate, id } = options || {};

    if (!id) {
      const shasum = createHash('sha1');
      shasum.update(label);
      id = shasum.digest('hex');
    }

    let intervalId;

    try {
      // Refine our estimate using previous durations.
      estimate = getEstimate(id, estimate, storagePath);

      const startTime = Date.now();

      const { frames, interval } = spinner;

      let index = 0;

      intervalId = setInterval(() => {
        index = ++index % frames.length;

        let updateString = theme`{asciiInProgress ${
          frames[index]
        }} {label ${label}}`;

        if (estimate > 0) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = estimate - elapsedTime;

          let humanizedEstimate = humanizeRemaining(elapsedTime, estimate);
          humanizedEstimate =
            remainingTime < 0
              ? theme.estimateExceeded(humanizedEstimate)
              : theme.estimate(humanizedEstimate);

          const progressBar = getProgressBar(elapsedTime / estimate, theme);

          updateString += theme` ${progressBar} {estimate ${humanizedEstimate}}`;
        }

        logFunction(updateString);
      }, interval);

      const returnValue = await promise;

      const actualDuration = Date.now() - startTime;

      // Record the actual duration for later.
      // It will help us predict future runs more accurately.
      updateEstimate(id, actualDuration, storagePath);

      const humanizedActual = humanizeActual(actualDuration);

      logFunction(
        theme`{asciiCompleted ✓} {label ${label}} {estimate ${humanizedActual}}`
      );
      logFunction.done();

      return returnValue;
    } catch (error) {
      logFunction.clear();

      throw error;
    } finally {
      clearInterval(intervalId);
    }
  };
};

module.exports = configureLogger;
