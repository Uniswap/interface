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
