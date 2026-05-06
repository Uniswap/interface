/* oxlint-disable typescript/no-unnecessary-condition */
import 'polyfill-object.fromentries'
import { Buffer } from 'buffer'
import { ResizeObserver } from '@juggle/resize-observer'
import flat from 'array.prototype.flat'
import flatMap from 'array.prototype.flatmap'

flat.shim()
flatMap.shim()

declare global {
  interface Window {
    Buffer: typeof Buffer
  }
}

if (!window.__DEV__) {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax
  window.__DEV__ = process.env.NODE_ENV === 'development'
}

if (!window.Buffer) {
  window.Buffer = Buffer
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver
}
