import * as Sentry from '@sentry/react'
export { ErrorBoundary } from '@sentry/react'

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

export function init(options: Sentry.BrowserOptions) {
  return Sentry.init(options)
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
