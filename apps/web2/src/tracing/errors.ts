import { ClientOptions, ErrorEvent, EventHint } from '@sentry/types'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

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

  return event
}

type ErrorLike = Partial<Error> & Required<Pick<Error, 'message'>>
function isErrorLike(error: unknown): error is ErrorLike {
  return error instanceof Object && 'message' in error && typeof (error as Partial<ErrorLike>)?.message === 'string'
}

/** Identifies ethers request errors (as thrown by {@type import(@ethersproject/web).fetchJson}). */
function isEthersRequestErrorLike(error: ErrorLike): error is ErrorLike & { requestBody: string } {
  return 'requestBody' in error && typeof (error as Record<'requestBody', unknown>).requestBody === 'string'
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

// TODO(WEB-2400): Refactor to use a config instead of returning true for each condition.
function shouldRejectError(error: EventHint['originalException']) {
  // Some libraries throw ErrorLike objects ({ code, message, stack }) instead of true Errors.
  if (isErrorLike(error)) {
    if (isEthersRequestErrorLike(error)) {
      const method = JSON.parse(error.requestBody).method
      // ethers aggressively polls for block number, and it sometimes fails (whether spuriously or through rate-limiting).
      // If block number polling, it should not be considered an exception.
      if (method === 'eth_blockNumber') return true
    }

    // If the error is based on a user rejecting, it should not be considered an exception.
    // TODO(WEB-2398): we should catch these errors and handle them gracefully instead.
    if (didUserReject(error)) return true

    // If the error is a network change, it should not be considered an exception.
    if (error.message.match(/underlying network changed/)) return true

    // This is caused by HTML being returned for a chunk from Cloudflare.
    // Usually, it's the result of a 499 exception right before it, which should be handled.
    // Therefore, this can be ignored.
    if (error.message.match(/Unexpected token '<'/)) return true

    // Content security policy 'unsafe-eval' errors can be filtered out because there are expected failures.
    // For example, if a user runs an eval statement in console this error would still get thrown.
    // TODO(WEB-2348): We should extend this to filter out any type of CSP error.
    if (error.message.match(/'unsafe-eval'.*content security policy/i)) return true
    if (error.message.match(/Blocked a frame with origin ".*" from accessing a cross-origin frame./)) return true
    if (error.message.match(/NotAllowedError: Write permission denied./)) return true

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

    if ('stack' in error && typeof error.stack === 'string') {
      // Errors coming from a browser extension can be ignored. These errors are usually caused by extensions injecting
      // scripts into the page, which we cannot control.
      if (error.stack.match(/-extension:\/\//i)) return true

      // Errors coming from OneKey (a desktop wallet) can be ignored for now.
      // These errors are either application-specific, or they will be thrown separately outside of OneKey.
      if (error.stack.match(/OneKey/i)) return true
    }

    // These are caused by user navigation away from the page before a request has finished.
    if (error instanceof DOMException && error?.name === 'AbortError') return true
  }

  return false
}
