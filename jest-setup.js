// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
// required polyfill for rtk-query baseQueryFn
import 'cross-fetch/polyfill'

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({ init: () => jest.fn() }))

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
jest.mock('@react-native-firebase/analytics', () => {})
jest.mock('@react-native-firebase/app', () => {})
jest.mock('@react-native-firebase/auth', () => {})
jest.mock('@react-native-firebase/firestore', () => {})

const mockPerf = {
  firebase: {
    perf: () => ({ setPerformanceCollectionEnabled: () => jest.fn() }),
  },
}
jest.mock('@react-native-firebase/perf', () => mockPerf)

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

// Ledger bluetooth library doesn't have JS mock
jest.mock('@ledgerhq/react-native-hw-transport-ble', () => {})

jest.mock('expo-linear-gradient', () => {})

jest.mock('src/data/relay', () => {
  const { createMockEnvironment } = require('relay-test-utils')
  return createMockEnvironment()
})

global.__reanimatedWorkletInit = jest.fn()
