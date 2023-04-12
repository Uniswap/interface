import 'components/analytics'

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { ErrorEvent, EventHint } from '@sentry/types'
import { initializeAnalytics, OriginApplication } from '@uniswap/analytics'
import { SharedEventName } from '@uniswap/analytics-events'
import { isSentryEnabled } from 'utils/env'
import { getEnvName, isProductionEnv } from 'utils/env'

import { filterKnownErrors } from './errors'

export { trace } from './trace'

// Dump some metadata into the window to allow client verification.
window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

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
  beforeSend(event: ErrorEvent, hint: EventHint) {
    /*
     * Since the interface currently uses HashRouter, URLs will have a # before the path.
     * This leads to issues when we send the URL into Sentry, as the path gets parsed as a "fragment".
     * Instead, this logic removes the # part of the URL.
     * See https://romain-clement.net/articles/sentry-url-fragments/#url-fragments
     **/
    if (event.request?.url) {
      event.request.url = event.request.url.replace('/#', '')
    }

    return filterKnownErrors(event, hint)
  },
})

initializeAnalytics(AMPLITUDE_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL,
  defaultEventName: SharedEventName.PAGE_VIEWED,
  commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
})
