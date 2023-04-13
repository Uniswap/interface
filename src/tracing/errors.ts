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

    if (error.message.match(/Loading chunk \d+ failed\. \(error: .+\.chunk\.js\)/)) {
      const asset = error.message.match(/https?:\/\/.+?\.chunk\.js/)?.[0]
      const resource = [...performance.getEntriesByType('resource')].find(({ name }) => name === asset)
      // `responseStatus` is not on the `ResponseStatus` type, because it's only supported on some browsers at the moment.
      const status = (resource as any)?.responseStatus
      // If the status if 499, then we ignore. If there's no status, for now we'll ignore all chunk loading errors also.
      if (!status || status === 499) {
        return null
      }
    }
  }

  return event
}
