import 'workbox-precaching' // defines __WB_MANIFEST

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute, Route } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

import { DocumentRoute } from './document'
import { splitAssetsAndEntries } from './utils'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Registers the document route for the precached document.
// This must be done before setting up workbox-precaching, so that it takes precedence.
registerRoute(new DocumentRoute())

// Splits entries into assets, which are loaded on-demand; and entries, which are precached.
// Effectively, this caches all media assets on-demand and pre-caches everything else.
const { assets, entries } = splitAssetsAndEntries(self.__WB_MANIFEST)

// Registers the assets' routes for on-demand caching.
registerRoute(
  new Route(
    ({ url }) => assets.includes('.' + url.pathname),
    new CacheFirst({
      cacheName: 'assets',
      plugins: [new ExpirationPlugin({ maxEntries: 16 })],
    })
  )
)

// Precaches entries and registers a default route to serve them.
precacheAndRoute(entries)
