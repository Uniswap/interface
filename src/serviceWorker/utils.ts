/// <reference lib="webworker" />

import { PrecacheEntry } from 'workbox-precaching/_types'

declare const self: ServiceWorkerGlobalScope

export function isDevelopment() {
  return Boolean(
    self.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address
    self.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4
    self.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) ||
    // vercel previews
    self.location.hostname.endsWith('.vercel.app')
  )
}

export function toURL(entry: string | PrecacheEntry): string {
  return typeof entry === 'string' ? entry : entry.url
}

export const splitAssetsAndEntries = (
  resources: (string | PrecacheEntry)[]
): { assets: string[]; entries: PrecacheEntry[] } => {
  return resources.reduce<{ assets: string[]; entries: PrecacheEntry[] }>(
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
}
