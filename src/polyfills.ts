import 'polyfill-object.fromentries'

import { ResizeObserver } from '@juggle/resize-observer'
import flat from 'array.prototype.flat'
import flatMap from 'array.prototype.flatmap'

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver
}

flat.shim()
flatMap.shim()
