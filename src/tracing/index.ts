import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { SharedEventName } from '@uniswap/analytics-events'
import { initializeAnalytics, OriginApplication } from 'analytics'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { isDevelopmentEnv, isProductionEnv, isSentryEnabled } from 'utils/env'
import { getEnvName } from 'utils/env'
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

initializeAnalytics(AMPLITUDE_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL,
  defaultEventName: SharedEventName.PAGE_VIEWED,
  commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
  debug: isDevelopmentEnv(),
  reportOriginCountry: (country: string) => store.dispatch(setOriginCountry(country)),
})
