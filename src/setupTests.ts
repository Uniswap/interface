import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests

import { Readable } from 'stream'
import { TextDecoder, TextEncoder } from 'util'

if (typeof global.TextEncoder === 'undefined') {
  global.ReadableStream = Readable as unknown as typeof globalThis.ReadableStream
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as typeof global.TextDecoder
}

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  }

jest.mock('react-popper', () => {
  const { usePopper } = jest.requireActual('react-popper')
  return {
    usePopper(...args: Parameters<typeof usePopper>) {
      const popper = usePopper(...args)
      // Prevent popper from asynchronously debouncing updates during tests.
      popper.update = popper.forceUpdate
      return popper
    },
  }
})
