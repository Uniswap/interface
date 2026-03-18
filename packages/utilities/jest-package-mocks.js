/**
 * Common mocks for this package. This file is intended to be imported in the jest-setup.js file of the package.
 *
 * TODO(INFRA-292): Remove this file when other packages are migrated to vitest
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

const util = require('util')

global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

jest.mock('expo-localization', () => ({
  getLocales: () => [
    {
      languageCode: 'en',
      languageTag: 'en-US',
      regionCode: null,
      currencyCode: null,
      currencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      textDirection: null,
      measurementSystem: null,
      temperatureUnit: null,
    },
  ],
}))

jest.mock('utilities/src/environment/env', () => ({
  isTestEnv: jest.fn(() => true),
  isDevEnv: jest.fn(() => false),
  isBetaEnv: jest.fn(() => false),
  isProdEnv: jest.fn(() => false),
  isRNDev: jest.fn(() => true),
  isPlaywrightEnv: jest.fn(() => false),
}))

jest.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    // leave it empty as we should avoid it in test mode
    logger: {},
  },
}))
