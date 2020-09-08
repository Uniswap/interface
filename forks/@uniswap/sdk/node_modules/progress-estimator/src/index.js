'use strict';

const { dots } = require('cli-spinners');
const logUpdate = require('log-update');
const { tmpdir } = require('os');

const configureLogger = require('./logger');

const defaultConfiguration = {
  logFunction: logUpdate,
  spinner: dots,
  storagePath: `${tmpdir()}/progress-estimator`,
  theme: require('./theme')
};

const createLogger = optionalConfiguration => {
  return configureLogger({
    ...defaultConfiguration,
    ...optionalConfiguration
  });
};

module.exports = createLogger;
