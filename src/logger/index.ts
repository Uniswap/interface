import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export { ErrorBoundary } from '@sentry/react'

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

export function init(options: Sentry.BrowserOptions) {
  return Sentry.init({
    // Tracing configuration
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0, // 1.0 while testing (https://docs.sentry.io/platforms/javascript/guides/react/performance/#verify)
    ...options,
  })
}

export function log(message: string, severity: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, severity)
  switch (severity) {
    case 'debug':
      return console.debug(message)
    case 'info':
      return console.info(message)
    case 'log':
      return console.log(message)
    case 'warning':
      return console.warn(message)
    case 'error':
    case 'fatal':
      return console.error(message)
  }
}
