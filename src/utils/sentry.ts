import * as Sentry from '@sentry/react'

export function reportException(e: any) {
  process.env.REACT_APP_MAINNET_ENV === 'production' && Sentry.captureException(e)
}
