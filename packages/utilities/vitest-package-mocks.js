/**
 * Common mocks for this package. This file is intended to be imported in the vitest-setup.ts file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

const util = require('util')

global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

vi.mock('expo-localization', () => ({
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

vi.mock('utilities/src/environment/env', () => ({
  isTestEnv: vi.fn(() => true),
  isDevEnv: vi.fn(() => false),
  isBetaEnv: vi.fn(() => false),
  isProdEnv: vi.fn(() => false),
  isRNDev: vi.fn(() => true),
  isPlaywrightEnv: vi.fn(() => false),
}))

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    // leave it empty as we should avoid it in test mode
    logger: {},
  },
}))
