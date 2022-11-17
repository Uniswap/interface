// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'
// required polyfill for rtk-query baseQueryFn
import 'cross-fetch/polyfill'

// Mock Amplitde log reporting
jest.mock('@amplitude/analytics-react-native', () => ({
  init: () => jest.fn(),
  identify: () => jest.fn(),
  flush: () => jest.fn(),
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

// Mock vision lib due to native deps
jest.mock('react-native-vision-camera', () => {})

// Mock expo clipboard lib due to native deps
jest.mock('expo-clipboard', () => {})

// Setup Async Storage mocking: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests()

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('src/features/providers/providerSaga')

jest.mock('src/lib/RNEthersRs')

// Mock Firebase packages
jest.mock('@react-native-firebase/remote-config', () => {})
jest.mock('@react-native-firebase/app', () => {})
jest.mock('@react-native-firebase/auth', () => {})
jest.mock('@react-native-firebase/firestore', () => {})

// Mock OneSignal package
jest.mock('react-native-onesignal', () => {
  return {
    setLogLevel: jest.fn(),
    setAppId: jest.fn(),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    setNotificationWillShowInForegroundHandler: jest.fn(),
    setNotificationOpenedHandler: jest.fn(),
  }
})

jest.mock('expo-linear-gradient', () => {})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native-permissions', () => {})
jest.mock('react-native-device-info', () => mockRNDeviceInfo)

global.__reanimatedWorkletInit = () => {}
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
