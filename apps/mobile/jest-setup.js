// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js'
// required polyfill for rtk-query baseQueryFn
import 'cross-fetch/polyfill'
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

// NOTE: I tried adding this to jest.config.js globals, but it doesn't seem to pass it
// so added it here and it works. This fixes the "Must set TAMAGUI_TARGET" warnings during tests
process.env.TAMAGUI_TARGET = 'native'

// avoids polutting console in test runs, while keeping important log levels
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock Amplitde log reporting
jest.mock('@amplitude/analytics-react-native', () => ({
  flush: () => jest.fn(),
  identify: () => jest.fn(),
  init: () => jest.fn(),
  setDeviceId: () => jest.fn(),
  track: () => jest.fn(),
}))

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (val) => val,
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
}))

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

// Setup Async Storage mocking: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

require('react-native-reanimated/src/reanimated2/jestUtils').setUpTests()

// Disables animated driver warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('wallet/src/features/providers/saga')

jest.mock('src/lib/RNEthersRs')

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

// Mock OneSignal package
jest.mock('react-native-onesignal', () => {
  return {
    setLogLevel: jest.fn(),
    setAppId: jest.fn(),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    setNotificationWillShowInForegroundHandler: jest.fn(),
    setNotificationOpenedHandler: jest.fn(),
    getDeviceState: () => ({ userId: 'dummyUserId' }),
  }
})

jest.mock('react-native-appsflyer', () => {
  return {
    initSdk: jest.fn(),
  }
})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native-permissions', () => ({}))
jest.mock('react-native-device-info', () => mockRNDeviceInfo)

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

// from https://github.com/facebook/react-native/issues/28839#issuecomment-625453688
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native') // use original implementation, which comes with mocks out of the box

  return RN
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn().mockImplementation(() => 200),
}))

global.__reanimatedWorkletInit = () => ({})
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
