import * as Sentry from '@sentry/react'
import { addExceptionMechanism } from '@sentry/utils'

const ON_UNHANDLED_REJECTION = 'onunhandledrejection'

/**
 * Adds a mechanism to events which have been sent from onUnhandledRejection.
 *
 * This is necessary to access the Sentry.Event directly, in order to call addExceptionMechanism. Alternatively
 * Alternatively, we could create a Sentry.Event in onUnhandledRejection, but custom events are non-trivial and poorly documented.
 */
export function beforeSendAddMechanism(event: Sentry.Event): Sentry.Event {
  // Global exception handlers set an extra.mechanism, but the actual mechanism must be set on the event explicitly for
  // Sentry to correctly process and display it in the Sentry UI. We still want mechanism to be set, despite using our
  // own handler, because it aids in identifying unhandled errors and rejections.
  if (event.extra?.mechanism) {
    if (event.extra.mechanism === ON_UNHANDLED_REJECTION) {
      addExceptionMechanism(event, { handled: false, type: event.extra.mechanism })
      delete event.extra.mechanism // delete this so it doesn't clutter the Sentry UI
    }
  }

  return event
}

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestError(error: Error): error is Error & { requestBody: string } {
  return 'requestBody' in error && typeof (error as unknown as Record<'requestBody', unknown>).requestBody === 'string'
}

export function onUnhandledRejection({ reason }: { reason: unknown }) {
  if (reason instanceof Error) {
    if (isEthersRequestError(reason)) {
      const method = JSON.parse(reason.requestBody).method

      // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
      // If it fails, it should not be considered an exception.
      if (method === 'eth_blockNumber') return
    }

    // If the error is a network change, it should not be considered an exception.
    if (reason.message.match(/underlying network changed/)) {
      // It should still be logged so that it is available as a Sentry breadcrumb for other exceptions (logs are
      // captured as breadcrumbs via Sentry's CaptureConsole integration).
      console.warn(reason)
      return
    }
  }

  Sentry.captureException(reason, { extra: { mechanism: ON_UNHANDLED_REJECTION } })
}
