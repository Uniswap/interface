import * as Sentry from '@sentry/react'

export function onerror(event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) {
  // We still send handled/mechanism tags despite using our own handler. These errors are still unhandled.
  const tags = { handled: 'no', mechanism: 'onerror' }
  Sentry.captureException(error ?? event, { tags })
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

  // We still send handled/mechanism tags despite using our own handler. These rejections are still unhandled.
  const tags = { handled: 'no', mechanism: 'onunhandledrejection' }
  Sentry.captureException(reason, { tags })
}
