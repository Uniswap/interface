import '@testing-library/jest-dom' // jest custom assertions
import { useWeb3React } from '@web3-react/core'
import 'jest-styled-components' // adds style diffs to snapshot tests

import { Readable } from 'stream'
import { mocked } from 'test-utils/mocked'
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
    usePopper: function () {
      const popper = usePopper(arguments)
      // Prevent popper from asynchronously debouncing updates during tests.
      popper.update = popper.forceUpdate
      return popper
    }
  }
})
