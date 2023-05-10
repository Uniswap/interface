import 'workbox-precaching' // defines __WB_MANIFEST

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute, Route } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

import { DocumentRoute } from './document'
import { groupEntries } from './utils'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Registers the document route for the precached document.
// This must be done before setting up workbox-precaching, so that it takes precedence.
registerRoute(new DocumentRoute())

const { onDemandEntries, precacheEntries } = groupEntries(self.__WB_MANIFEST)
const onDemandURLs = onDemandEntries.map((entry) => (typeof entry === 'string' ? entry : entry.url))

registerRoute(
  new Route(
    ({ url }) => onDemandURLs.includes('.' + url.pathname),
    new CacheFirst({
      cacheName: 'media',
      plugins: [new ExpirationPlugin({ maxEntries: 16 })],
    })
  )
)

precacheAndRoute(precacheEntries)
