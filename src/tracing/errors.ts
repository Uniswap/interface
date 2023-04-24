import { ClientOptions, ErrorEvent, EventHint } from '@sentry/types'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

/* `responseStatus` is only currently supported on certain browsers.
 * see: https://caniuse.com/mdn-api_performanceresourcetiming_responsestatus
 */
declare global {
  interface PerformanceEntry {
    responseStatus?: number
  }
}

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestError(error: Error): error is Error & { requestBody: string } {
  return 'requestBody' in error && typeof (error as unknown as Record<'requestBody', unknown>).requestBody === 'string'
}

export function beforeSend(event: ErrorEvent, hint: EventHint) {
  /*
   * Since the interface currently uses HashRouter, URLs will have a # before the path.
   * This leads to issues when we send the URL into Sentry, as the path gets parsed as a "fragment".
   * Instead, this logic removes the # part of the URL.
   * See https://romain-clement.net/articles/sentry-url-fragments/#url-fragments
   **/
  if (event.request?.url) {
    event.request.url = event.request.url.replace('/#', '')
  }

  return filterKnownErrors(event, hint)
}

function shouldFilterChunkError(asset?: string) {
  const entries = [...(performance?.getEntriesByType('resource') ?? [])]
  const resource = entries?.find(({ name }) => name === asset)
  const status = resource?.responseStatus

  /*
   * If the status if 499, then we ignore.
   * If there's no status (meaning the browser doesn't support `responseStatus`) then we also ignore.
   * These errors are likely also 499 errors, and we can catch any spikes in non-499 chunk errors via other browsers.
   */
  return !status || status === 499
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

    /*
     * This ignores 499 errors, which are caused by Cloudflare when a request is cancelled.
     * CF claims that some number of these is expected, and that they should be ignored.
     * See https://groups.google.com/a/uniswap.org/g/cloudflare-eng/c/t3xvAiJFujY.
     */
    if (error.message.match(/Loading chunk \d+ failed\. \(([a-zA-Z]+): .+\.chunk\.js\)/)) {
      const asset = error.message.match(/https?:\/\/.+?\.chunk\.js/)?.[0]
      if (shouldFilterChunkError(asset)) return null
    }

    if (error.message.match(/Loading CSS chunk \d+ failed\. \(.+\.chunk\.css\)/)) {
      const relativePath = error.message.match(/\/static\/css\/.*\.chunk\.css/)?.[0]
      const asset = `https://app.uniswap.org${relativePath}`
      if (shouldFilterChunkError(asset)) return null
    }

    /*
     * This is caused by HTML being returned for a chunk from Cloudflare.
     * Usually, it's the result of a 499 exception right before it, which should be handled.
     * Therefore, this can be ignored.
     */
    if (error.message.match(/Unexpected token '<'/)) return null

    /*
     * Content security policy 'unsafe-eval' errors can be filtered out because there are expected failures.
     * For example, if a user runs an eval statement in console this error would still get thrown.
     * TODO(INFRA-176): We should extend this to filter out any type of CSP error.
     */
    if (error.message.match(/'unsafe-eval'.*content security policy/i)) {
      return null
    }
  }

  return event
}
