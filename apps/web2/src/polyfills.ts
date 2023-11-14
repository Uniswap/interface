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

if (!window.Buffer) {
  window.Buffer = Buffer
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver
}
