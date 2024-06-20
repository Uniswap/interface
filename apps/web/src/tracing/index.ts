import 'zone.js'

import { BrowserTracing } from '@sentry/browser'
import * as Sentry from '@sentry/react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { OriginApplication } from '@uniswap/analytics'
import store from 'state'
import { setOriginCountry } from 'state/user/reducer'
import { beforeSend } from 'tracing/errors'
import { patchFetch } from 'tracing/request'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
import { getEnvName, isSentryEnabled } from 'utils/env'
import { v4 as uuidv4 } from 'uuid'

patchFetch(global)

// Dump some metadata into the window to allow client verification.
window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

// This is used to identify the user in Sentry.
const SENTRY_USER_ID_KEY = 'sentry-user-id'

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  release: process.env.REACT_APP_GIT_COMMIT_HASH,
  environment: getEnvName(),
  enabled: isSentryEnabled(),
  tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  integrations: [
    // Instruments pageload (and any requests that it depends on):
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

getAnalyticsAtomDirect(true).then((allowAnalytics) => {
  analytics.init(
    new ApplicationTransport({
      serverUrl: uniswapUrls.amplitudeProxyUrl,
      appOrigin: OriginApplication.INTERFACE,
      reportOriginCountry: (country: string) => store.dispatch(setOriginCountry(country)),
    }),
    allowAnalytics,
    process.env.REACT_APP_GIT_COMMIT_HASH
  )
})
