import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests

import type { createPopper } from '@popperjs/core'
import { Readable } from 'stream'
import { TextDecoder, TextEncoder } from 'util'

window.open = jest.fn()

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

// Prevent popper from making state updates asynchronously.
// This is necessary to avoid warnings during tests, as popper will asynchronously update state outside of test setup.
jest.mock('@popperjs/core', () => {
  const { act } = jest.requireActual('@testing-library/react')
  const core = jest.requireActual('@popperjs/core')
  return {
    ...core,
    createPopper: (...args: Parameters<typeof createPopper>) => {
      const [referenceElement, popperElement, options] = args
      if (options?.modifiers) {
        options.modifiers = options.modifiers.filter((modifier) => !modifier.fn)
      }
      return core.createPopper(referenceElement, popperElement, options)
    },
  }
})
