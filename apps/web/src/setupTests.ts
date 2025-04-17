/* eslint-disable no-console */
import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests
import 'polyfills' // add polyfills
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
import 'utilities/src/logger/mocks'

import type { createPopper } from '@popperjs/core'
import { useWeb3React } from '@web3-react/core'
import failOnConsole from 'jest-fail-on-console'
import { disableNetConnect, restore as restoreNetConnect } from 'nock'
import React from 'react'
import { Readable } from 'stream'
import { toBeVisible } from 'test-utils/matchers'
import { mocked } from 'test-utils/mocked'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import * as gatingHooks from 'uniswap/src/features/gating/hooks'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { TextDecoder, TextEncoder } from 'util'

// Mock EXPO_OS environment variable
process.env.EXPO_OS = 'web'

setupi18n()

// Sets origin to the production origin, because some tests depend on this.
// This prevents each test file from needing to set this manually.
globalThis.origin = 'https://app.uniswap.org'

// Polyfill browser APIs (jest is a node.js environment):
{
  window.open = jest.fn()
  window.getComputedStyle = jest.fn()

  if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.ReadableStream = Readable as unknown as typeof globalThis.ReadableStream
    globalThis.TextEncoder = TextEncoder
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
  }

  globalThis.matchMedia =
    globalThis.matchMedia ||
    ((query) => {
      const reducedMotion = query.match(/prefers-reduced-motion: ([a-zA-Z0-9-]+)/)

      return {
        // Needed for reanimated to disable reduced motion warning in tests
        matches: reducedMotion ? reducedMotion[1] === 'no-preference' : false,
        addListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
    })

  globalThis.performance.measure = jest.fn()
  globalThis.performance.mark = jest.fn()

  globalThis.React = React
}

jest.mock('react-native-svg', () => require('@tamagui/react-native-svg'))

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

jest.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  const { Empty } = jest.requireActual('@web3-react/empty')
  return {
    ...web3React,
    initializeConnector: () =>
      web3React.initializeConnector(
        (actions: Parameters<typeof web3React.initializeConnector>[0]) => new Empty(actions),
      ),
    useWeb3React: jest.fn(),
  }
})

jest.mock('state/routing/slice', () => {
  const routingSlice = jest.requireActual('state/routing/slice')
  return {
    ...routingSlice,
    // Prevents unit tests from logging errors from failed getQuote queries
    useGetQuoteQuery: () => ({
      isError: false,
      data: undefined,
      error: undefined,
      currentData: undefined,
    }),
  }
})

jest.mock('state/routing/quickRouteSlice', () => {
  const quickRouteSlice = jest.requireActual('state/routing/quickRouteSlice')
  return {
    ...quickRouteSlice,
    // Prevents unit tests from logging errors from failed getQuote queries
    useGetQuickRouteQuery: () => ({
      isError: false,
      data: undefined,
      error: undefined,
      currentData: undefined,
    }),
  }
})

/**
 * Fail tests if anything is logged to the console. This keeps the console clean and ensures test output stays readable.
 * If something should log to the console, it should be stubbed and asserted:
 * @example
 * beforeEach(() => jest.spyOn(console, 'error').mockReturnsValue())
 * it('should log an error', () => {
 *   example()
 *   expect(console.error).toHaveBeenCalledWith(expect.any(Error))
 * })
 */

failOnConsole({
  shouldFailOnAssert: true,
  shouldFailOnDebug: true,
  shouldFailOnError: true,
  shouldFailOnInfo: true,
  shouldFailOnLog: true,
  shouldFailOnWarn: true,
  allowMessage: (message, type) => {
    if (type === 'error') {
      // TODO(TAM-47): remove this allowed warning once Tamagui is upgraded >= 1.100
      if (message.startsWith('[moti]: Invalid transform value.')) {
        return true
      }
    }
    return false
  },
})

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    ...jest.genMockFromModule<typeof gatingHooks>('uniswap/src/features/gating/hooks'),
    useStatsigClientStatus: () => ({
      isStatsigLoading: false,
      isStatsigReady: true,
      isStatsigUninitialized: false,
    }), // Specific custom mock for useStatsigClientStatus
  }
})

jest.mock('uniswap/src/features/chains/hooks/useOrderedChainIds', () => {
  return {
    useOrderedChainIds: (chainIds: UniverseChainId[]) => chainIds,
  }
})

function muteStatsigWarnings() {
  jest.spyOn(console, 'warn').mockImplementation((message, ...args) => {
    const isStatsigWarning = args.some((arg) => {
      return typeof arg === 'string' && arg.includes('Statsig')
    })

    if (isStatsigWarning) {
      return
    } else {
      // Forward all other warnings to console.warn to avoid losing them
      console.warn(message, ...args)
    }
  })
}

const originalConsoleDebug = console.debug
// Mocks are configured to reset between tests (by CRA), so they must be set in a beforeEach.
beforeEach(() => {
  // Mock window.getComputedStyle, because it is otherwise too computationally expensive to unit test.
  // Not mocking this results in multi-second tests when using popper.js.
  mocked(window.getComputedStyle).mockImplementation(() => new CSSStyleDeclaration())

  // Mock useWeb3React to return a chainId of 1 by default.
  mocked(useWeb3React).mockReturnValue({ chainId: 1 } as ReturnType<typeof useWeb3React>)

  // Disable network connections by default.
  disableNetConnect()

  // Mock feature flags
  mocked(useFeatureFlag).mockReturnValue(false)

  // Prevent amplitude debugs from triggering failOnConsole
  console.debug = jest.fn((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('[amplitude(Identify)')) {
      return
    }
    originalConsoleDebug(...args)
  })
  // TODO: can be removed after wrapping the test app in StatsigProvider and mocking flags and configs
  muteStatsigWarnings()
})

afterEach(() => {
  // Without this, nock causes a memory leak and the tests will fail on CI.
  // https://github.com/nock/nock/issues/1817
  restoreNetConnect()
})

expect.extend({
  toBeVisible,
})
