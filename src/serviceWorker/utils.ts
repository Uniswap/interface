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

function toURL(entry: string | PrecacheEntry): string {
  return typeof entry === 'string' ? entry : entry.url
}

type GroupedEntries = { onDemandCacheEntries: string[]; precacheEntries: PrecacheEntry[] }
export const groupEntries = (resources: (string | PrecacheEntry)[]): GroupedEntries => {
  return resources.reduce<GroupedEntries>(
    ({ onDemandCacheEntries, precacheEntries }, entry) => {
      if (typeof entry === 'string') {
        return { precacheEntries, onDemandCacheEntries: [...onDemandCacheEntries, entry] }
      } else if (entry.url.includes('/media/')) {
        return { precacheEntries, onDemandCacheEntries: [...onDemandCacheEntries, toURL(entry)] }
      } else {
        return { precacheEntries: [...precacheEntries, entry], onDemandCacheEntries }
      }
    },
    { onDemandCacheEntries: [], precacheEntries: [] }
  )
}
