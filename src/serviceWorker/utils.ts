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

type GroupedEntries = { mediaURLs: string[]; precacheEntries: PrecacheEntry[] }
export function groupEntries(entries: (string | PrecacheEntry)[]): GroupedEntries {
  return entries.reduce<GroupedEntries>(
    ({ mediaURLs, precacheEntries }, entry) => {
      if (typeof entry === 'string') {
        return { precacheEntries, mediaURLs: [...mediaURLs, entry] }
      } else if (entry.url.includes('/media/')) {
        return { precacheEntries, mediaURLs: [...mediaURLs, entry.url] }
      } else {
        return { precacheEntries: [...precacheEntries, entry], mediaURLs }
      }
    },
    { mediaURLs: [], precacheEntries: [] }
  )
}
