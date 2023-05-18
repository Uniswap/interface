import { ClientOptions, ErrorEvent, EventHint } from '@sentry/types'

// `responseStatus` is only currently supported on certain browsers.
// see: https://caniuse.com/mdn-api_performanceresourcetiming_responsestatus
declare global {
  interface PerformanceEntry {
    responseStatus?: number
  }
}

/**
 * Filters known (ignorable) errors out before sending them to Sentry. Also, adds tags to the event.
 * Intended as a {@link ClientOptions.beforeSend} callback. Returning null filters the error from Sentry.
 */
export const beforeSend: Required<ClientOptions>['beforeSend'] = (event: ErrorEvent, hint: EventHint) => {
  if (shouldRejectError(hint.originalException)) {
    return null
  }

  updateRequestUrl(event)
  addChunkResponseStatusTag(event, hint)

  return event
}

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestError(error: Error): error is Error & { requestBody: string } {
  return 'requestBody' in error && typeof (error as unknown as Record<'requestBody', unknown>).requestBody === 'string'
}

// Since the interface currently uses HashRouter, URLs will have a # before the path.
// This leads to issues when we send the URL into Sentry, as the path gets parsed as a "fragment".
// Instead, this logic removes the # part of the URL.
// It also removes trailing slashes, as they are not needed.
// See https://romain-clement.net/articles/sentry-url-fragments/#url-fragments
function updateRequestUrl(event: ErrorEvent) {
  if (event.request?.url) {
    event.request.url = event.request.url.replace('/#', '')
    if (event.request.url.endsWith('/')) {
      event.request.url = event.request.url.slice(0, -1)
    }
  }
}

// If a request fails due to a chunk error, this looks for that asset in the performance entries.
// If found, it adds a tag to the event with the response status of the chunk request.
function addChunkResponseStatusTag(event: ErrorEvent, hint: EventHint) {
  const error = hint.originalException
  if (error instanceof Error) {
    let asset: string | undefined
    if (error.message.match(/Loading chunk \d+ failed\. \(([a-zA-Z]+): .+\.chunk\.js\)/)) {
      asset = error.message.match(/https?:\/\/.+?\.chunk\.js/)?.[0]
    }

    if (error.message.match(/Loading CSS chunk \d+ failed\. \(.+\.chunk\.css\)/)) {
      const relativePath = error.message.match(/\/static\/css\/.*\.chunk\.css/)?.[0]
      asset = `${window.origin}${relativePath}`
    }

    if (asset) {
      const status = getChunkResponseStatus(asset)
      if (status) {
        if (!event.tags) {
          event.tags = {}
        }
        event.tags.chunkResponseStatus = status
      }
    }
  }
}

function getChunkResponseStatus(asset?: string): number | undefined {
  const entries = [...(performance?.getEntriesByType('resource') ?? [])]
  const resource = entries?.find(({ name }) => name === asset)
  return resource?.responseStatus
}

function shouldRejectError(error: EventHint['originalException']) {
  if (error instanceof Error) {
    // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
    // If block number polling, it should not be considered an exception.
    if (isEthersRequestError(error)) {
      const method = JSON.parse(error.requestBody).method
      if (method === 'eth_blockNumber') return true
    }

    // If the error is a network change, it should not be considered an exception.
    if (error.message.match(/underlying network changed/)) return true

    // This is caused by HTML being returned for a chunk from Cloudflare.
    // Usually, it's the result of a 499 exception right before it, which should be handled.
    // Therefore, this can be ignored.
    if (error.message.match(/Unexpected token '<'/)) return true

    // Errors coming from a Chrome Extension can be ignored for now. These errors are usually caused by extensions injecting
    // scripts into the page, which we cannot control.
    if (error.stack?.match(/chrome-extension:\/\//i)) return true

    // Errors coming from OneKey (a desktop wallet) can be ignored for now.
    // These errors are either application-specific, or they will be thrown separately outside of OneKey.
    if (error.stack?.match(/OneKey/i)) return true

    // Content security policy 'unsafe-eval' errors can be filtered out because there are expected failures.
    // For example, if a user runs an eval statement in console this error would still get thrown.
    // TODO(INFRA-176): We should extend this to filter out any type of CSP error.
    if (error.message.match(/'unsafe-eval'.*content security policy/i)) {
      return true
    }

    // WebAssembly compilation fails because we do not allow 'unsafe-eval' in our CSP.
    // Any thrown errors are due to 3P extensions/applications, so we do not need to handle them.
    if (error.message.match(/WebAssembly.instantiate\(\): Wasm code generation disallowed by embedder/)) {
      return true
    }

    // Filters out errors caused by checking for meta tags that may not exist.
    if (
      error.message.match(/null is not an object \(evaluating 'document\.querySelector\('meta\[[^\]]+\]'\)\.content'\)/)
    ) {
      return true
    }

    // These are caused by user navigation away from the page before a request has finished.
    if (error instanceof DOMException && error.name === 'AbortError') return true
  }

  return false
}
