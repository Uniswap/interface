// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

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

// Setup Async Storage mocking: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests()

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('src/features/providers/providerSaga')
