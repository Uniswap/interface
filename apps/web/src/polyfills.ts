/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import 'polyfill-object.fromentries'

import { ResizeObserver } from '@juggle/resize-observer'
import flat from 'array.prototype.flat'
import flatMap from 'array.prototype.flatmap'
import { Buffer } from 'buffer'

flat.shim()
flatMap.shim()

declare global {
  interface Window {
    Buffer: typeof Buffer
  }
}

if (!window.__DEV__) {
  window.__DEV__ = process.env.NODE_ENV === 'development'
}

if (!window.Buffer) {
  window.Buffer = Buffer
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver
}

// Polyfill for crypto.randomUUID if not available
// This is needed for environments that don't support crypto.randomUUID (e.g., older Node.js versions, some browsers)
const cryptoObj = typeof crypto !== 'undefined' ? crypto : typeof window !== 'undefined' ? window.crypto : undefined
if (cryptoObj && !cryptoObj.randomUUID) {
  cryptoObj.randomUUID = function randomUUID(): string {
    // Generate a UUID v4 using crypto.getRandomValues
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const bytes = new Uint8Array(16)
    cryptoObj.getRandomValues(bytes)

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10

    // Convert to hex string
    const hex = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    // Format as UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-')
  }
}
