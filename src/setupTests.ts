// jest custom assertions
import '@testing-library/jest-dom'

import { TextDecoder, TextEncoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as typeof global.TextDecoder
}
