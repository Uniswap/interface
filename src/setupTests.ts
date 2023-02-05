import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests

import { server } from 'mocks/server'
import { Readable } from 'stream'
import { TextDecoder, TextEncoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  global.ReadableStream = Readable as unknown as typeof globalThis.ReadableStream
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as typeof global.TextDecoder
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: console.log })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  jest.clearAllMocks()
  jest.resetModules()
  server.close()
})
