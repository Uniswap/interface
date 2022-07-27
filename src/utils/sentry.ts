import * as Sentry from '@sentry/react'

export function reportException(e: any) {
  Sentry.captureException(e)
}
