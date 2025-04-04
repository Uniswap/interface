import { BrowserTracing } from '@sentry/browser'
import * as Sentry from '@sentry/react'
import { getEnvName } from 'tracing/env'
import { beforeSend } from 'tracing/errors'
import { v4 as uuidv4 } from 'uuid'

const SENTRY_USER_ID_KEY = 'sentry-user-id'

export function setupSentry() {
  // setup Sentry
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_GIT_COMMIT_HASH,
    environment: getEnvName(),
    enabled: true,
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

  // This is used to identify the user in Sentry.
  let sentryUserId = localStorage.getItem(SENTRY_USER_ID_KEY)
  if (!sentryUserId) {
    localStorage.setItem(SENTRY_USER_ID_KEY, (sentryUserId = uuidv4()))
  }
  Sentry.setUser({ id: sentryUserId })
}
