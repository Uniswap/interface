import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'
import { getCacheKeyForURL, matchPrecache } from 'workbox-precaching'
import { Route } from 'workbox-routing'

import { isDevelopment } from './utils'

const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$')
export const DOCUMENT = process.env.PUBLIC_URL + '/index.html'

/**
 * Matches with App Shell-style routing, so that navigation requests are fulfilled with an index.html shell.
 * See https://developers.google.com/web/fundamentals/architecture/app-shell
 */
export function matchDocument({ request, url }: RouteMatchCallbackOptions) {
  // If this isn't a navigation, skip.
  if (request.mode !== 'navigate') {
    return false
  }

  // If this looks like a resource (ie has a file extension), skip.
  if (url.pathname.match(fileExtensionRegexp)) {
    return false
  }

  // If this isn't app.uniswap.org (or a local build), skip.
  // IPFS gateways may not have domain separation, so they cannot use document caching.
  if (url.hostname !== 'app.uniswap.org' && !isDevelopment()) {
    return false
  }

  return true
}

type HandlerContext = {
  offlineDocument?: Response
} | void

/**
 * The returned document should always be fresh, so this handler uses a custom strategy:
 *
 * - Always fetches the document.
 * - When available, compares the etag headers of the fetched and cached documents:
 *   - If matching (fresh) or missing (offline), returns the cached document.
 *   - If not matching (stale), returns the fetched document.
 *
 * This ensures that the user will always see the latest document. It requires a network fetch to check the cached
 * document's freshness, but does not require a full fetch in most cases, so it still saves time. This is identical to
 * the browser's builtin etag strategy, reimplemented in the ServiceWorker.
 *
 * In addition, this handler may serve an offline document if there is no internet connection.
 */
export async function handleDocument(this: HandlerContext, { event, request }: RouteHandlerCallbackOptions) {
  // If we are offline, serve the offline document.
  if ('onLine' in navigator && !navigator.onLine) return this?.offlineDocument?.clone() || fetch(request)

  // The exact cache key should be used for requests, as etags will be different for different paths.
  // This also prevents usage of preloadResponse.
  const requestUrl = getCacheKeyForURL(DOCUMENT)
  const cachedResponse = await matchPrecache(DOCUMENT)

  // Responses will throw if offline, but if cached the cached response should still be returned.
  const controller = new AbortController()
  let response
  try {
    response = await fetch(requestUrl || DOCUMENT, { cache: 'reload', signal: controller.signal })
    if (!cachedResponse) {
      return new Response(response.body, response)
    }
  } catch (e) {
    if (!cachedResponse) throw e
    return CachedDocument.from(cachedResponse)
  }

  // The etag header can be queried before the entire response body has streamed, so it is still a
  // performant cache key.
  const etag = response?.headers.get('etag')
  const cachedEtag = cachedResponse?.headers.get('etag')
  if (etag && etag === cachedEtag) {
    // If the cache is still fresh, cancel the pending response.
    controller.abort()
    return CachedDocument.from(cachedResponse)
  }

  return new Response(response.body, response)
}

export class DocumentRoute extends Route {
  constructor(offlineDocument?: Response) {
    super(matchDocument, handleDocument.bind({ offlineDocument }), 'GET')
  }
}

/**
 * A cache-specific version of the document.
 * This document sets the local `__isDocumentCached` variable to true.
 */
export class CachedDocument extends Response {
  static async from(response: Response) {
    const text = await response.text()

    // Set the content-type explicitly. Some browsers (Android 12; Chrome 91) use an invalid content-type header.
    const headers = new Headers(response.headers)
    headers.set('Content-Type', 'text/html; charset=utf-8')
    const init = { ...response, headers }

    // Injects a marker into the document so that client code knows it was served from cache.
    // The marker should be injected immediately in the <body> so it is available to client code.
    return new CachedDocument(text.replace('<body>', '<body><script>window.__isDocumentCached=true</script>'), init)
  }

  private constructor(text: string, response: Response) {
    super(text, response)
  }
}
