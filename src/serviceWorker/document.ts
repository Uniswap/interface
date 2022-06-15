import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'
import * as navigationPreload from 'workbox-navigation-preload'
import { matchPrecache } from 'workbox-precaching'
import { Route } from 'workbox-routing'

import { isLocalhost } from './utils'

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
  if (url.hostname !== 'app.uniswap.org' && !isLocalhost()) {
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
 * - Always fetches the document (using navigationPreload, if supported).
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

  // Always use index.html, as its already been matched for App Shell-style routing (@see {@link matchDocument}).
  const cachedResponse = await matchPrecache(DOCUMENT)
  const { preloadResponse } = event as unknown as { preloadResponse: Promise<Response | undefined> }

  // Responses will throw if offline, but if cached the cached response should still be returned.
  const controller = new AbortController()
  let response
  try {
    response = (await preloadResponse) || (await fetch(DOCUMENT, { signal: controller.signal }))
    if (!cachedResponse) {
      return response
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
    // If the cache is still fresh, cancel the pending response. The preloadResponse is cancelled
    // automatically by returning before it is settled; cancelling the preloadResponse will log
    // an error to the console, but it can be ignored - it *should* be cancelled.
    controller.abort()
    return CachedDocument.from(cachedResponse)
  }

  return response
}

export class DocumentRoute extends Route {
  constructor(offlineDocument?: Response) {
    navigationPreload.enable()
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

    // Injects a marker into the document so that client code knows it was served from cache.
    // The marker should be injected immediately in the <head> so it is available to client code.
    return new CachedDocument(text.replace('<head>', '<head><script>window.__isDocumentCached=true</script>'), response)
  }

  private constructor(text: string, public response: Response) {
    super(text, response)
  }
}
