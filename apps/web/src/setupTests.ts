// biome-ignore-all lint/suspicious/noConsole: test file
import '@testing-library/jest-dom' // jest custom assertions
import 'jest-styled-components' // adds style diffs to snapshot tests
import 'polyfills' // add polyfills

import { createPopper } from '@popperjs/core'
import {
  BaseWalletAdapter,
  SupportedTransactionVersions,
  WalletName,
  WalletReadyState,
} from '@solana/wallet-adapter-base'
import { useWeb3React } from '@web3-react/core'
import { config as loadEnv } from 'dotenv'
import failOnConsole from 'jest-fail-on-console'
import { disableNetConnect, restore as restoreNetConnect } from 'nock'
import React from 'react'
import { Readable } from 'stream'
import { toBeVisible } from 'test-utils/matchers'
import { mocked } from 'test-utils/mocked'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { TextDecoder, TextEncoder } from 'util'

loadEnv()

// Mock @solana/wallet-adapter-coinbase to prevent window access errors
vi.mock('@solana/wallet-adapter-coinbase', () => ({
  CoinbaseWalletName: 'Coinbase Wallet',
  CoinbaseWalletAdapter: class MockCoinbaseWalletAdapter extends BaseWalletAdapter {
    name = 'Coinbase Wallet' as WalletName
    url = 'https://www.coinbase.com/wallet'
    icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0Ij48L3N2Zz4='
    supportedTransactionVersions = new Set(['legacy', 0]) as SupportedTransactionVersions

    private _connecting = false
    private _publicKey = null
    private _readyState = WalletReadyState.NotDetected // Use string instead of enum to avoid async import

    constructor(_config = {}) {
      super()
      // Mock constructor - no actual initialization needed
    }

    get publicKey() {
      return this._publicKey
    }
    get connecting() {
      return this._connecting
    }
    get readyState() {
      return this._readyState
    }
    get connected() {
      return !!this._publicKey
    }

    async connect() {
      this._connecting = true
      // Mock connection logic without actual browser APIs
      this._connecting = false
    }
    async disconnect() {
      this._publicKey = null
    }
    async sendTransaction(): Promise<string> {
      throw new Error('Mock adapter cannot send transactions')
    }
    async signTransaction() {
      throw new Error('Mock adapter cannot sign transactions')
    }
    async signAllTransactions() {
      throw new Error('Mock adapter cannot sign transactions')
    }
    async signMessage() {
      throw new Error('Mock adapter cannot sign messages')
    }
  },
}))

vi.mock('react-native-reanimated', async () => {
  const mock = await vi.importActual<any>('react-native-reanimated/src/mock')
  return {
    ...mock,
    default: {
      ...mock.default,
      createAnimatedComponent: (component: any) => component,
    },
    createAnimatedComponent: (component: any) => component,
  }
})

// Mock environment variables
process.env.EXPO_OS = 'web'
process.env.REACT_APP_ANALYTICS_REQUEST_TIMEOUT_MS = '10000'
process.env.REACT_APP_ANALYTICS_FLUSH_TIMEOUT_MS = '5000'

setupi18n()

// Sets origin to the production origin, because some tests depend on this.
// This prevents each test file from needing to set this manually.
globalThis.origin = 'https://app.uniswap.org'

// Polyfill browser APIs (jest is a node.js environment):
// biome-ignore lint/complexity/noUselessLoneBlockStatements: block used to scope polyfill assignments
{
  window.open = vi.fn()
  window.getComputedStyle = vi.fn()

  if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.ReadableStream = Readable as unknown as typeof globalThis.ReadableStream
    globalThis.TextEncoder = TextEncoder
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
  }

  globalThis.matchMedia =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    globalThis.matchMedia ||
    ((query) => {
      const reducedMotion = query.match(/prefers-reduced-motion: ([a-zA-Z0-9-]+)/)

      return {
        // Needed for reanimated to disable reduced motion warning in tests
        matches: reducedMotion ? reducedMotion[1] === 'no-preference' : false,
        addListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

  globalThis.performance.measure = vi.fn()
  globalThis.performance.mark = vi.fn()

  globalThis.React = React
}

vi.mock('react-native-svg', () => require('@tamagui/react-native-svg'))

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
}))

vi.mock('ui/src/components/touchable/TouchableArea', () => ({
  TouchableArea: ({ children, ..._props }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
}))

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    // leave it empty as we should avoid it in test mode
    logger: {},
  },
}))

// This package must be mocked because it doesn't support ESM
vi.mock('@uniswap/analytics-events', () => {
  return {
    SharedEventName: {},
    sendAnalyticsEvent: vi.fn(),
    trace: vi.fn(),
  }
})

vi.mock('@tamagui/animations-moti', () => ({
  createAnimations: () => ({
    '100ms': {
      type: 'timing',
      duration: 100,
    },
    fast: {
      type: 'timing',
      duration: 100,
    },
    slow: {
      type: 'timing',
      duration: 100,
    },
  }),
  MotiView: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
}))

vi.mock('@uniswap/analytics', () => ({
  Trace: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  TraceEvent: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
  analytics: {
    track: vi.fn(),
    identify: vi.fn(),
    flush: vi.fn(),
  },
  __esModule: true,
}))

vi.mock('utilities/src/telemetry/analytics/constants', () => ({
  ANALYTICS_FLUSH_TIMEOUT: 5000,
  ANALYTICS_REQUEST_TIMEOUT: 10000,
  ANALYTICS_BATCH_SIZE: 100,
  DEFAULT_ANALYTICS_CONFIG: {},
  ALLOW_ANALYTICS_ATOM_KEY: 'allow-analytics',
  __esModule: true,
}))

vi.mock('utilities/src/platform', async () => {
  const actual = await vi.importActual('utilities/src/platform')
  return {
    ...actual,
    isWebPlatform: true,
    isWebApp: true,
    isMobileWeb: false,
    isExtensionApp: false,
  }
})

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  Trace: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
}))

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn().mockResolvedValue({ type: 'opened' }),
  dismissBrowser: vi.fn().mockResolvedValue(undefined),
  openAuthSessionAsync: vi.fn().mockResolvedValue({ type: 'success', url: '' }),
  maybeCompleteAuthSession: vi.fn().mockResolvedValue(undefined),
  warmUpAsync: vi.fn().mockResolvedValue(undefined),
  coolDownAsync: vi.fn().mockResolvedValue(undefined),
  WebBrowserResultType: {
    CANCEL: 'cancel',
    DISMISS: 'dismiss',
    OPENED: 'opened',
    LOCKED: 'locked',
  },
}))

vi.mock('expo-clipboard', () => ({
  Clipboard: {
    getStringAsync: vi.fn().mockResolvedValue(''),
    setStringAsync: vi.fn().mockResolvedValue(undefined),
    hasStringAsync: vi.fn().mockResolvedValue(false),
    getImageAsync: vi.fn().mockResolvedValue(null),
    setImageAsync: vi.fn().mockResolvedValue(undefined),
    hasImageAsync: vi.fn().mockResolvedValue(false),
  },
  ClipboardPasteButton: ({ children, onPress, ...props }: any) => {
    return React.createElement('button', { onClick: onPress, ...props }, children)
  },
}))

vi.mock('moti', () => ({
  View: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  Text: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  AnimatePresence: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  MotiView: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  MotiText: ({ children }: any) => {
    return React.createElement(React.Fragment, {}, children)
  },
  useAnimationState: () => ({
    current: 'initial',
    transitionTo: vi.fn(),
  }),
  useDynamicAnimation: () => ({
    animate: vi.fn(),
  }),
  __esModule: true,
}))

vi.mock('@popperjs/core', async () => {
  const core: any = await vi.importActual('@popperjs/core')
  return {
    ...core,
    createPopper: (...args: Parameters<typeof createPopper>) => {
      const [referenceElement, popperElement, options = {}] = args

      // Prevent popper from making state updates asynchronously.
      // This is necessary to avoid warnings during tests, as popper will asynchronously update state outside of test setup.
      options.modifiers?.push({
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

vi.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))

vi.mock('@web3-react/core', async () => {
  const web3React: any = await vi.importActual('@web3-react/core')
  const { Empty }: any = await vi.importActual('@web3-react/empty')
  return {
    ...web3React,
    initializeConnector: () =>
      web3React.initializeConnector(
        (actions: Parameters<typeof web3React.initializeConnector>[0]) => new Empty(actions),
      ),
    useWeb3React: vi.fn(),
  }
})

vi.mock('state/routing/slice', async () => {
  const routingSlice = await vi.importActual('state/routing/slice')
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

/**
 * Fail tests if anything is logged to the console. This keeps the console clean and ensures test output stays readable.
 * If something should log to the console, it should be stubbed and asserted:
 * @example
 * beforeEach(() => vi.spyOn(console, 'error').mockReturnsValue())
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
    if (type === 'warn') {
      // Allow UniversalImage warnings about not being able to retrieve remote images in test environment
      if (message.includes('Could not retrieve and format remote image for uri')) {
        return true
      }
    }
    return false
  },
})

vi.mock('uniswap/src/features/gating/hooks', async () => {
  const genMock = await vi.importActual('uniswap/src/features/gating/hooks')
  return {
    ...genMock,
    useFeatureFlag: vi.fn(),
    useFeatureFlagWithLoading: vi.fn(),
    getFeatureFlag: vi.fn(),
    getFeatureFlagWithExposureLoggingDisabled: vi.fn(),
    useExperimentGroupNameWithLoading: vi.fn(),
    useExperimentGroupName: vi.fn(),
    useExperimentValue: vi.fn(),
    getExperimentValue: vi.fn(),
    useExperimentValueWithExposureLoggingDisabled: vi.fn(),
    useDynamicConfigValue: vi.fn(),
    getDynamicConfigValue: vi.fn(),
    getExperimentValueFromLayer: vi.fn(),
    useExperimentValueFromLayer: vi.fn(),
    checkTypeGuard: vi.fn(),
    useStatsigClientStatus: () => ({
      isStatsigLoading: false,
      isStatsigReady: true,
      isStatsigUninitialized: false,
    }), // Specific custom mock for useStatsigClientStatus
  }
})

vi.mock('uniswap/src/features/chains/hooks/useOrderedChainIds', () => {
  return {
    useOrderedChainIds: (chainIds: UniverseChainId[]) => chainIds,
  }
})

function muteStatsigWarnings() {
  const originalWarn = console.warn
  vi.spyOn(console, 'warn').mockImplementation((message, ...args) => {
    const isStatsigWarning = args.some((arg) => {
      return typeof arg === 'string' && arg.includes('Statsig')
    })

    if (isStatsigWarning) {
      return
    } else {
      // Forward all other warnings to the original console.warn to avoid losing them
      originalWarn(message, ...args)
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
  console.debug = vi.fn((...args) => {
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
