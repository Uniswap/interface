import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'
import * as navigationPreload from 'workbox-navigation-preload'
import { PrecacheController } from 'workbox-precaching'
import { Route } from 'workbox-routing'

import { isLocalhost } from './utils'

export const OFFLINE_DOCUMENT = process.env.PUBLIC_URL + '/offline.html'
export const OFFLINE_REVISION = '1'

const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$')
const DOCUMENT = process.env.PUBLIC_URL + '/index.html'

navigationPreload.enable()

export class DocumentRoute extends Route {
  constructor(controller: PrecacheController) {
    super(matchDocument, handleDocument.bind(controller), 'GET')
  }
}

function matchDocument({ request, url }: RouteMatchCallbackOptions) {
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
  if (url.hostname !== 'app.uniswap.org' && !isLocalhost) {
    return false
  }

  return true
}

/**
 * The returned document should always be fresh, so the handler uses a custom strategy:
 *
 * - Always fetch the latest document (using navigationPreload, if supported)
 * - When available, compare the etag headers of the latest and cached documents:
 *   - If matching (fresh) or missing (offline), return the cached document.
 *   - If not matching (stale), return the latest document.
 * - When fetched, update the cache with the latest document.
 *
 * This ensures that the user will always see the latest document. It requires a network fetch to
 * check the cache document's freshness, but does not require a full fetch, so it still saves time.
 * This is identical to the browser's builtin etag strategy, reimplemented in the ServiceWorker.
 */
async function handleDocument(this: PrecacheController, { event, request }: RouteHandlerCallbackOptions) {
  // If we are offline, serve the offline document.
  if (!navigator.onLine) return (await this.matchPrecache(OFFLINE_DOCUMENT)) || fetch(request)

  const cachedResponse = await this.matchPrecache(request)
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
    return cachedResponse
  }

  // The etag header can be queried before the entire response body has streamed, so it is still a
  // performant cache key.
  const etag = response?.headers.get('etag')
  const cachedEtag = cachedResponse?.headers.get('etag')
  if (cachedResponse && etag && etag === cachedEtag) {
    // If the cache is still fresh, cancel the pending response. The preloadResponse is cancelled
    // automatically by returning before it is settled; cancelling the preloadResponse will log
    // an error to the console, but it can be ignored - it *should* be cancelled.
    controller.abort()
    return new CachedDocument(cachedResponse)
  }
  return response
}

/**
 * A cache-specific version of the document.
 * This document will set the local __isDocumentCached variable to true.
 */
// TODO(leggechr): Send a GA beacon from the client to record cache usage / metrics.
export class CachedDocument extends Response {
  constructor(response: Response) {
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
    super(stream, response)
  }
}
