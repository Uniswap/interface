import 'workbox-precaching' // defines __WB_MANIFEST

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { PrecacheEntry } from 'workbox-precaching/_types'
import { registerRoute, Route } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

import { DocumentRoute } from './document'
import { toURL } from './utils'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Registers the document route for the precached document.
// This must be done before setting up workbox-precaching, so that it takes precedence.
registerRoute(new DocumentRoute())

// Splits entries into assets, which are loaded on-demand; and entries, which are precached.
// Effectively, this caches all media assets on-demand and pre-caches everything else.
const { assets, entries } = self.__WB_MANIFEST.reduce<{ assets: string[]; entries: PrecacheEntry[] }>(
  ({ assets, entries }, entry) => {
    if (typeof entry === 'string') {
      // If the entry is a string, it's the index.html file.
      return { entries, assets: [...assets, entry] }
    } else if (entry.url.includes('/media/')) {
      // If the entry is a media file, it's an asset.
      return { entries, assets: [...assets, toURL(entry)] }
    } else {
      // Otherwise, it's an entry.
      return { entries: [...entries, entry], assets }
    }
  },
  { assets: [], entries: [] }
)

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
