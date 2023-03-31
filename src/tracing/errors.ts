import * as Sentry from '@sentry/react'

// We still want handled/mechanism tags despite using our own handler. These exceptions are still unhandled.
const ON_ERROR_TAGS = { handled: 'no', mechanism: 'onerror' }
const ON_UNHANDLED_REJECTION_TAGS = { handled: 'no', mechanism: 'onunhandledrejection' }

export function onerror(event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) {
  Sentry.captureException(error ?? event, { tags: ON_ERROR_TAGS })
}

export function onunhandledrejection({ reason }: { reason: unknown }) {
  if (reason instanceof Error) {
    // Parse ethers request errors (formated by {@type import(@ethersproject/web).fetchJson}):
    if ('requestBody' in reason && typeof reason.requestBody === 'string') {
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

  Sentry.captureException(reason, { tags: ON_UNHANDLED_REJECTION_TAGS })
}
