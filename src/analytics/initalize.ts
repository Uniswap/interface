import { init } from '@amplitude/analytics-browser'
import { isProductionEnv } from 'utils/env'

/**
 * Initializes Amplitude with API key for project.
 *
 * Uniswap has two Amplitude projects: test and production. You must be a
 * member of the organization on Amplitude to view details.
 */

const AMPLITUDE_KEY_NAME = isProductionEnv() ? 'REACT_APP_AMPLITUDE_KEY' : 'REACT_APP_AMPLITUDE_TEST_KEY'
const API_KEY = process.env[AMPLITUDE_KEY_NAME]

const userId = undefined // Should be undefined to let Amplitude default to Device ID

// Disable tracking of private user information by Amplitude
const options = {
  trackingOptions: {
    ipAddress: false,
    carrier: false,
    city: false,
    region: false,
    dma: false, // designated market area
  },
}

export function initializeAnalytics() {
  if (typeof API_KEY === 'undefined') {
    console.error(`${AMPLITUDE_KEY_NAME} is undefined, Amplitude analytics will not run.`)
    return
  }
  init(API_KEY, userId, options)
}
