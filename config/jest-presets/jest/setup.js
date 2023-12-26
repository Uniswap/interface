// Sets up global.chrome in jest environment
//
const storage = require('mem-storage-area')
const mockRNCNetInfo = require('@react-native-community/netinfo/jest/netinfo-mock.js')
const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock')
const mockRNDeviceInfo = require('react-native-device-info/jest/react-native-device-info-mock')

// required polyfill for rtk-query baseQueryFn
require('cross-fetch/polyfill')

global.chrome = {
    storage: {
    ...storage, // mem-storage-area is a reimplementation of chrome.storage in memory
    session: {
      set: jest.fn(),
      get: jest.fn()
    }
  },
  runtime: {
    getURL: (path) => `chrome/path/to/${path}`
  }
}

// Setup Async Storage mocking: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock redux-persist due to type issue in CI
// https://github.com/rt2zz/redux-persist/issues/1243#issuecomment-692609748
jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist')
  return {
    ...real,
    persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
  }
})

// Mock expo clipboard lib due to native deps
jest.mock('expo-clipboard', () => ({
  setString: jest.fn(),
  setStringAsync: jest.fn(),
  getStringAsync: () => Promise.resolve(),
}))
jest.mock('expo-blur', () => ({ BlurView: {} }))
jest.mock('expo-barcode-scanner', () => ({}))
jest.mock('expo-av', () => ({}))
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: jest.fn() }))
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => 'ExpoLinearGradient' }))
jest.mock('expo-screen-capture', () => ({ addScreenshotListener: jest.fn() }))

// Mock Amplitde log reporting
jest.mock('@amplitude/analytics-react-native', () => ({
  flush: () => jest.fn(),
  identify: () => jest.fn(),
  init: () => jest.fn(),
  setDeviceId: () => jest.fn(),
  track: () => jest.fn(),
}))

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native-device-info', () => mockRNDeviceInfo)

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('wallet/src/features/providers/saga')

// Mock WalletConnect v2 packages
jest.mock('@walletconnect/web3wallet', () => ({
  Web3Wallet: {
    init: () => ({
      on: jest.fn(),
      getActiveSessions: () => [],
      getPendingSessionProposals: () => [],
      getPendingSessionRequests: () => [],
    }),
  },
}))

jest.mock('@walletconnect/core', () => ({
  Core: jest.fn().mockImplementation(() => ({
    crypto: { getClientId: jest.fn() },
  })),
}))

jest.mock('@walletconnect/utils', () => ({
  getSdkError: jest.fn(),
  parseUri: jest.fn(),
  buildApprovedNamespaces: jest.fn(),
}))

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (val) => val,
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
}))

jest.mock('react-native-appsflyer', () => {
  return {
    initSdk: jest.fn(),
  }
})

// NetInfo mock does not export typescript types
const NetInfoStateType = {
  unknown: 'unknown',
  none: 'none',
  cellular: 'cellular',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  ethernet: 'ethernet',
  wimax: 'wimax',
  vpn: 'vpn',
  other: 'other',
}

jest.mock('@react-native-community/netinfo', () => ({ ...mockRNCNetInfo, NetInfoStateType }))

jest.mock('statsig-react-native', () => {
  const real = jest.requireActual('statsig-react-native')
  const StatsigMock = {
    ...real,
    useGate: () => {
      return {
        isLoading: false,
        value: false,
      }
    },
    useConfig: () => {
      return {}
    },

    Statsig: {
      checkGate: () => false,
      getConfig: () => {
        return {
          get: (_name, fallback) => fallback,
          getValue: (_name, fallback) => fallback,
        }
      },
    },
  }
  return StatsigMock
})

global.__DEV__ = true
