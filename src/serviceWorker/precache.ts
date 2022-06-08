import { PrecacheEntry } from 'workbox-precaching/_types'

import { toURL } from './utils'

/** Filters unused assets' precache entries from the manifest. */
export function filterPrecacheEntries(entry: string | PrecacheEntry) {
  const url = toURL(entry)

  // If this isn't a variable font, do not precache.
  // Modern browsers - those that support precaching - only need variable fonts.
  if (url.endsWith('.woff') || (url.endsWith('.woff2') && !url.includes('.var'))) {
    return false
  }

  return true
}
