import * as Sentry from '@sentry/react'
import { addExceptionMechanism } from '@sentry/utils'

const ON_ERROR = 'onerror'
const ON_UNHANDLED_REJECTION = 'onunhandledrejection'

/** Adds a mechanism to events which have been sent from our global exception handlers. */
export function beforeSendAddMechanism(event: Sentry.Event): Sentry.Event {
  // Global exception handlers set an extra.mechanism, but the actual mechanism must be set on the event explicitly for
  // Sentry to correctly process and display it in the Sentry UI. We still want mechanism to be set, despite using our
  // own handler, because it aids in identifying unhandled errors and rejections.
  if (event.extra?.mechanism) {
    if (event.extra.mechanism === ON_ERROR || event.extra.mechanism === ON_UNHANDLED_REJECTION) {
      addExceptionMechanism(event, { handled: false, type: event.extra.mechanism })
      delete event.extra.mechanism // delete this so it doesn't clutter the Sentry UI
    }
  }

  return event
}

export function onerror(event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) {
  Sentry.captureException(error ?? event, { extra: { mechanism: ON_ERROR } })
}

export function onunhandledrejection({ reason }: { reason: unknown }) {
  if (reason instanceof Error) {
    if (isEthersRequestError(reason)) {
      const method = JSON.parse(reason.requestBody).method

      // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
      // If it fails, it should not be considered an exception.
      if (method === 'eth_blockNumber') return
    }

    // If the error is a network change, it should not be considered an exception, but should still be breadcrumbed.
    if (reason.message.match(/underlying network changed/)) {
      console.warn(reason) // logging adds the message to the breadcrumbs
      return
    }
  }

  Sentry.captureException(reason, { extra: { mechanism: ON_UNHANDLED_REJECTION } })
}

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestError(error: Error): error is Error & { requestBody: string } {
  return 'requestBody' in error && typeof (error as unknown as Record<'requestBody', unknown>).requestBody === 'string'
}
