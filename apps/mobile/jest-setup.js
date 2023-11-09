// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js'
import 'core-js' // necessary so setImmediate works in tests
import { MockLocalizationContext } from 'wallet/src/test/utils'

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

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (val) => val,
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
}))

require('react-native-reanimated/src/reanimated2/jestUtils').setUpTests()

// Disables animated driver warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

jest.mock('src/lib/RNEthersRs')

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

jest.mock('react-native-permissions', () => ({}))

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

jest.mock('wallet/src/features/language/LocalizationContext', () => MockLocalizationContext)
