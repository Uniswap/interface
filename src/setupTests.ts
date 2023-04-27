import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests

import type { createPopper } from '@popperjs/core'
import { useWeb3React } from '@web3-react/core'
import { Readable } from 'stream'
import { mocked } from 'test-utils/mocked'
import { TextDecoder, TextEncoder } from 'util'

window.open = jest.fn()
window.getComputedStyle = jest.fn()

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

jest.mock('@popperjs/core', () => {
  const core = jest.requireActual('@popperjs/core')
  return {
    ...core,
    createPopper: (...args: Parameters<typeof createPopper>) => {
      const [referenceElement, popperElement, options = {}] = args

      // Prevent popper from making state updates asynchronously.
      // This is necessary to avoid warnings during tests, as popper will asynchronously update state outside of test setup.
      options?.modifiers?.push({
        name: 'synchronousUpdate',
        enabled: true,
        phase: 'beforeMain',
        effect: (state) => {
          state.instance.update = () => {
            state.instance.forceUpdate()
            return Promise.resolve(state.instance.state)
          }
        },
      })

      return core.createPopper(referenceElement, popperElement, options)
    },
  }
})

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
  // Mock window.getComputedStyle, because it is otherwise too computationally expensive to unit test.
  // Not mocking this results in multi-second tests when using popper.js.
  mocked(window.getComputedStyle).mockImplementation(() => new CSSStyleDeclaration())

  // Mock useWeb3React to return a chainId of 1 by default.
  mocked(useWeb3React).mockReturnValue({ chainId: 1 } as ReturnType<typeof useWeb3React>)
})
