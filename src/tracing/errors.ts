import * as Sentry from '@sentry/react'

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

  Sentry.getCurrentHub().captureException(reason, {
    originalException: reason,
    data: { mechanism: { handled: false, type: 'onunhandledrejection' } },
  })
}
