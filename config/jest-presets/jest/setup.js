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
      get: jest.fn(),
    },
  },
  runtime: {
    getURL: (path) => `chrome/path/to/${path}`,
  },
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
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: jest.fn(),
}))
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => 'ExpoLinearGradient' }))
jest.mock('expo-screen-capture', () => ({ addScreenshotListener: jest.fn() }))
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))
jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
}))

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
jest.mock('@reown/walletkit', () => ({
  WalletKit: {
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

jest.mock('@universe/gating', () => {
  const actual = jest.requireActual('@universe/gating')
  return {
    ...actual,
    // Mock functions
    useDynamicConfigValue: jest.fn((args) => args.defaultValue),
    useFeatureFlag: jest.fn(() => false),
    useGate: jest.fn(() => ({ isLoading: false, value: false })),
    useConfig: jest.fn(() => ({})),
    getStatsigClient: jest.fn(() => ({
      checkGate: jest.fn(() => false),
      getConfig: jest.fn(() => ({
        get: (_name, fallback) => fallback,
        getValue: (_name, fallback) => fallback,
      })),
      getLayer: jest.fn(() => ({
        get: jest.fn(() => false),
      })),
    })),
    Statsig: {
      checkGate: jest.fn(() => false),
      getConfig: jest.fn(() => ({
        get: (_name, fallback) => fallback,
        getValue: (_name, fallback) => fallback,
      })),
    },
  }
})

// TODO: Remove this mock after mocks in jest-expo are fixed
// (see the issue: https://github.com/expo/expo/issues/26893)
jest.mock('expo-web-browser', () => ({}))

global.__DEV__ = true
