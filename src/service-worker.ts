/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import 'workbox-precaching' // defines __WB_MANIFEST

import { clientsClaim, RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'
import * as navigationPreload from 'workbox-navigation-preload'
import { registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

const isLocalhost = Boolean(
  self.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    self.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    self.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
)
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$')
const DOCUMENT_HTML = process.env.PUBLIC_URL + '/index.html'
const DOCUMENT_CACHE = process.env.PUBLIC_URL + '/cache'

navigationPreload.enable()
clientsClaim()

/*
 * Assets are cached natively by the browser, so the manifest is unused by this ServiceWorker.
 * However, workbox will not work unless __WB_MANIFEST is present in this file.
 * TODO(leggechr): Add back in manifest precaching.
 */
void self.__WB_MANIFEST

registerRoute(matchDocument, handleDocument)

function matchDocument({ request, url }: RouteMatchCallbackOptions) {
  // If this isn't app.uniswap.org (or a local build), skip.
  // IPFS gateways may not have domain separation, so they cannot use document caching.
  if (url.hostname !== 'app.uniswap.org' && !isLocalhost) {
    return false
  }

  // If this isn't a navigation, skip.
  if (request.mode !== 'navigate') {
    return false
  }

  // If this looks like a resource (ie has a file extension), skip.
  if (url.pathname.match(fileExtensionRegexp)) {
    return false
  }

  return true
}

/*
 * The returned document should always be fresh, so the handler uses a custom strategy:
 *
 * - Always fetch the latest document (using navigationPreload, if supported)
 * - When available, compare the etag headers of the latest and cached documents:
 *   - If matching, return the cached document (this avoids waiting for the latest document response).
 *   - If not matching, return the latest document.
 * - When fetched, update the cache with the latest document.
 *
 * This ensures that the user will always see the latest document. It requires a network fetch to
 * check the cache document's freshness, but does not require a full fetch, so it still saves time.
 */
async function handleDocument({ event }: RouteHandlerCallbackOptions) {
  const { preloadResponse } = event as unknown as { preloadResponse: Promise<Response | undefined> }
  const controller = new AbortController()
  const response = (await preloadResponse) || (await fetch(DOCUMENT_HTML, { signal: controller.signal }))

  // Store the cached document in a Cache to decouple its lifetime from the ServiceWorker's.
  // Without using a Cache, the cached Response will be cleared anytime the ServiceWorker restarts.
  // See https://developer.mozilla.org/en-US/docs/Web/API/Cache.
  const cache = await caches.open(DOCUMENT_CACHE)
  const cached = await cache.match(DOCUMENT_HTML)

  // The etag header can be queried before the entire response body has streamed. In testing, the
  // etag header was available in 1/5 the time of the response body, so this is still an effective
  // caching strategy.
  const etag = response.headers.get('etag')
  const cachedEtag = cached?.headers.get('etag')
  if (cached && etag && etag === cachedEtag) {
    // If the cache is still fresh, cancel the pending response. The preloadResponse is cancelled
    // automatically by returning before it is settled; cancelling the preloadResponse will log
    // an error to the console, but it can be ignored - it *should* be cancelled.
    controller.abort()
    return cached.clone()
  } else {
    cache.put(DOCUMENT_HTML, responseForCache(response.clone()))
    return response
  }
}

// Prepare a response for the cache by having it set a local __isDocumentCached variable.
// TODO(leggechr): Send a GA beacon to record cache usage / metrics.
function responseForCache(response: Response) {
  const reader = response.body?.getReader()
  const stream = new ReadableStream({
    async start(controller) {
      let done = false
      while (!done) {
        const result = await reader?.read()
        done = !result || result.done
        if (result?.value) {
          controller.enqueue(result.value)
        }
      }
      controller.enqueue(new TextEncoder().encode('\n<script>__isDocumentCached = true</script>\n'))
      controller.close()
    },
  })
  return new Response(stream, response)
}
