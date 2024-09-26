// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import 'core-js' // necessary so setImmediate works in tests
import 'uniswap/src/i18n/i18n' // Uses real translations for tests
import 'utilities/src/logger/mocks'

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js'
import { localizeMock as mockRNLocalize } from 'react-native-localize/mock'
import { TextDecoder, TextEncoder } from 'util'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { mockSharedPersistQueryClientProvider } from 'uniswap/src/test/mocks/mockSharedPersistQueryClientProvider'
import { mockUIAssets } from 'ui/src/test/mocks/mockUIAssets'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (val) => val,
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
}))

// Disables animated driver warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

jest.mock('@walletconnect/react-native-compat', () => ({}))

jest.mock('src/lib/RNEthersRs')

// Mock OneSignal package
jest.mock('react-native-onesignal', () => {
  return {
    setLogLevel: jest.fn(),
    setAppId: jest.fn(),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    setNotificationWillShowInForegroundHandler: jest.fn(),
    setNotificationOpenedHandler: jest.fn(),
    getDeviceState: () => ({ userId: 'dummyUserId', pushToken: 'dummyPushToken' }),
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
  useSafeAreaFrame: jest.fn().mockImplementation(() => ({})),
  SafeAreaProvider: jest.fn(({ children }) => children),
}))

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn().mockImplementation(() => 200),
}))

require('react-native-reanimated').setUpTests()

jest.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext)

jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(),
}))

jest.mock('react-native-localize', () => mockRNLocalize)

jest.mock('@react-native-firebase/auth', () => () => ({
  signInAnonymously: jest.fn(),
}))

jest.mock('@react-native-firebase/app-check', () => () => ({
  appCheck: jest.fn(),
  newReactNativeFirebaseAppCheckProvider: jest.fn(() => ({
    configure: jest.fn(),
  })),
  initializeAppCheck: jest.fn().mockReturnValue(Promise.resolve()), // Return a resolved Promise
}))

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
}))

// Mock the appearance hook for all tests
const mockAppearanceSetting = AppearanceSettingType.System
jest.mock('wallet/src/features/appearance/hooks', () => {
  return {
    useCurrentAppearanceSetting: () => mockAppearanceSetting,
  }
})
jest.mock('wallet/src/features/appearance/hooks', () => {
  return {
    useSelectedColorScheme: () => 'light',
  }
})

jest.mock('openai')

jest.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

mockUIAssets()
