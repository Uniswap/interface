import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests

import { useWeb3React } from '@web3-react/core'
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

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  const { Empty } = jest.requireActual('@web3-react/empty')
  return {
    ...web3React,
    initializeConnector: () =>
      web3React.initializeConnector(
        (actions: Parameters<typeof web3React.initializeConnector>[0]) => new Empty(actions)
      ),
    useWeb3React: jest.fn(),
  }
})

// Mocks are configured to reset between tests (by CRA), so they must be set in a beforeEach.
beforeEach(() => {
  mocked(useWeb3React).mockReturnValue({ chainId: 1 } as ReturnType<typeof useWeb3React>)
})
