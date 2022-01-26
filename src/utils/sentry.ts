import * as Sentry from '@sentry/react'

export function reportException(e: any) {
  window.location.href.includes('kyberswap') && Sentry.captureException(e)
}
