// Sets up global.chrome in vitest environment
import { vi } from 'vitest'

// required polyfill for rtk-query baseQueryFn
import 'cross-fetch/polyfill'

// Setup chrome storage mock using mem-storage-area
const storage = require('mem-storage-area')
global.chrome = {
  storage: {
    ...storage, // mem-storage-area is a reimplementation of chrome.storage in memory
    session: {
      set: vi.fn(),
      get: vi.fn(),
    },
  },
  runtime: {
    getURL: (path) => `chrome/path/to/${path}`,
  },
}

// Setup Async Storage mocking
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(() => Promise.resolve()),
    getItem: vi.fn(() => Promise.resolve(null)),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiRemove: vi.fn(() => Promise.resolve()),
  },
}))

// Mock redux-persist due to type issue in CI
vi.mock('redux-persist', () => {
  const real = vi.importActual('redux-persist')
  return {
    ...real,
    persistReducer: vi.fn().mockImplementation((config, reducers) => reducers),
  }
})

// Mock expo clipboard lib due to native deps
vi.mock('expo-clipboard', () => ({
  setString: vi.fn(),
  setStringAsync: vi.fn(),
  getStringAsync: () => Promise.resolve(),
}))
vi.mock('expo-blur', () => ({ BlurView: {} }))
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: vi.fn(),
}))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: () => 'ExpoLinearGradient' }))
vi.mock('expo-screen-capture', () => ({ addScreenshotListener: vi.fn() }))

// Mock Amplitude log reporting
vi.mock('@amplitude/analytics-react-native', () => ({
  flush: () => vi.fn(),
  identify: () => vi.fn(),
  init: () => vi.fn(),
  setDeviceId: () => vi.fn(),
  track: () => vi.fn(),
}))

vi.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

// Mock React Native Device Info
vi.mock('react-native-device-info', () => ({
  default: {
    getDeviceId: vi.fn(() => 'test-device-id'),
    getModel: vi.fn(() => 'test-model'),
    getBrand: vi.fn(() => 'test-brand'),
    getSystemName: vi.fn(() => 'test-system'),
    getSystemVersion: vi.fn(() => '1.0'),
  },
}))

// mock initProviders to avoid creating real ethers providers for each test
vi.mock('wallet/src/features/providers/saga')

// Mock WalletConnect v2 packages
vi.mock('@reown/walletkit', () => ({
  WalletKit: {
    init: () => ({
      on: vi.fn(),
      getActiveSessions: () => [],
      getPendingSessionProposals: () => [],
      getPendingSessionRequests: () => [],
    }),
  },
}))

vi.mock('@walletconnect/core', () => ({
  Core: vi.fn().mockImplementation(() => ({
    crypto: { getClientId: vi.fn() },
  })),
}))

vi.mock('@walletconnect/utils', () => ({
  getSdkError: vi.fn(),
  parseUri: vi.fn(),
  buildApprovedNamespaces: vi.fn(),
}))

vi.mock('react-native-appsflyer', () => {
  return {
    initSdk: vi.fn(),
  }
})

// NetInfo mock
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    fetch: vi.fn(() =>
      Promise.resolve({
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
        details: {},
      }),
    ),
  },
  NetInfoStateType: {
    unknown: 'unknown',
    none: 'none',
    cellular: 'cellular',
    wifi: 'wifi',
    bluetooth: 'bluetooth',
    ethernet: 'ethernet',
    wimax: 'wimax',
    vpn: 'vpn',
    other: 'other',
  },
}))

// TODO: Remove this mock after mocks in jest-expo are fixed
// (see the issue: https://github.com/expo/expo/issues/26893)
vi.mock('expo-web-browser', () => ({}))

global.__DEV__ = true
