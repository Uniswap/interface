import '@testing-library/jest-dom'

import { ReadableStream } from 'stream/web'
import { TextDecoder, TextEncoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  global.ReadableStream = ReadableStream
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as typeof global.TextDecoder
}
