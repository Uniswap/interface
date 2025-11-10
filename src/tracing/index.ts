import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { SharedEventName } from '@uniswap/analytics-events'
import { initializeAnalytics, OriginApplication } from 'analytics'
import { isDevelopmentEnv, isSentryEnabled } from 'utils/env'
import { getEnvName, isProductionEnv } from 'utils/env'
import { v4 as uuidv4 } from 'uuid'

import { beforeSend } from './errors'

// Dump some metadata into the window to allow client verification.
window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

// This is used to identify the user in Sentry.
const SENTRY_USER_ID_KEY = 'sentry-user-id'

// Actual KEYs are set by proxy servers.
const AMPLITUDE_DUMMY_KEY = '00000000000000000000000000000000'
export const STATSIG_DUMMY_KEY = 'client-0000000000000000000000000000000000000000000'

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  release: process.env.REACT_APP_GIT_COMMIT_HASH,
  environment: getEnvName(),
  enabled: isSentryEnabled(),
  tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  integrations: [
    new BrowserTracing({
      startTransactionOnLocationChange: false,
      startTransactionOnPageLoad: true,
    }),
  ],
  beforeSend,
})

let sentryUserId = localStorage.getItem(SENTRY_USER_ID_KEY)
if (!sentryUserId) {
  localStorage.setItem(SENTRY_USER_ID_KEY, (sentryUserId = uuidv4()))
}
Sentry.setUser({ id: sentryUserId })

// Initialize analytics with either proxy URL or direct API key
const amplitudeKey = process.env.REACT_APP_AMPLITUDE_API_KEY || AMPLITUDE_DUMMY_KEY
const useProxy = !!process.env.REACT_APP_AMPLITUDE_PROXY_URL
const analyticsEnabled = amplitudeKey !== AMPLITUDE_DUMMY_KEY || useProxy

if (analyticsEnabled) {
  initializeAnalytics(amplitudeKey, OriginApplication.INTERFACE, {
    proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL, // undefined for direct API key mode
    defaultEventName: SharedEventName.PAGE_VIEWED,
    commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
    isProductionEnv: isProductionEnv(),
    debug: isDevelopmentEnv(),
  })
  if (isDevelopmentEnv()) {
    console.log(`[Analytics] Enabled - using ${useProxy ? 'proxy' : 'direct API key'}`)
  }
} else {
  if (isDevelopmentEnv()) {
    console.log('[Analytics] Disabled - no REACT_APP_AMPLITUDE_API_KEY or REACT_APP_AMPLITUDE_PROXY_URL configured')
  }
}
