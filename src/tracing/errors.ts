import { ClientOptions, ErrorEvent, EventHint } from '@sentry/types'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestError(error: Error): error is Error & { requestBody: string } {
  return 'requestBody' in error && typeof (error as unknown as Record<'requestBody', unknown>).requestBody === 'string'
}

/**
 * Filters known (ignorable) errors out before sending them to Sentry.
 * Intended as a {@link ClientOptions.beforeSend} callback. Returning null filters the error from Sentry.
 */
export const filterKnownErrors: Required<ClientOptions>['beforeSend'] = (event: ErrorEvent, hint: EventHint) => {
  const error = hint.originalException
  if (error instanceof Error) {
    // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
    // If block number polling, it should not be considered an exception.
    if (isEthersRequestError(error)) {
      const method = JSON.parse(error.requestBody).method
      if (method === 'eth_blockNumber') return null
    }

    // If the error is a network change, it should not be considered an exception.
    if (error.message.match(/underlying network changed/)) return null

    // If the error is based on a user rejecting, it should not be considered an exception.
    if (didUserReject(error)) return null

    // Cloudflare may serve HTML error pages (eg from a 499), which are already raised as ChunkLoadError.
    // Parsing the HTML results in a second SyntaxError. This not the root error (it is already reported as ChunkLoadError), so it should not be reported.
    if (error.message.match(/Unexpected token '<'/)) return null
  }

  return event
}
