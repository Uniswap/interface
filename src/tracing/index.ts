import 'components/analytics'

import * as Sentry from '@sentry/react'
import { GlobalHandlers } from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { initializeAnalytics, OriginApplication } from '@uniswap/analytics'
import { SharedEventName } from '@uniswap/analytics-events'
import { isSentryEnabled } from 'utils/env'
import { getEnvName, isProductionEnv } from 'utils/env'

import { beforeSendAddMechanism, onUnhandledRejection } from './errors'

export { trace } from './trace'

// Actual KEYs are set by proxy servers.
const AMPLITUDE_DUMMY_KEY = '00000000000000000000000000000000'
export const STATSIG_DUMMY_KEY = 'client-0000000000000000000000000000000000000000000'

// Dump some metadata into the window to allow client verification.
window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

window.onunhandledrejection = onUnhandledRejection

Sentry.init({
  // General configuration:
  dsn: process.env.REACT_APP_SENTRY_DSN,
  release: process.env.REACT_APP_GIT_COMMIT_HASH,
  environment: getEnvName(),
  integrations: [
    new GlobalHandlers({
      onerror: true,
      // Use our own handler for unhandled rejections; we want to have more control over which rejections are reported,
      // as many originate in third-party libraries and can be safely ignored.
      onunhandledrejection: false,
    }),
    new BrowserTracing({
      startTransactionOnLocationChange: false,
      startTransactionOnPageLoad: true,
    }),
  ],
  enabled: isSentryEnabled(),
  beforeSend: beforeSendAddMechanism,
  tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE ?? 0),
})

initializeAnalytics(AMPLITUDE_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL,
  defaultEventName: SharedEventName.PAGE_VIEWED,
  commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
})
