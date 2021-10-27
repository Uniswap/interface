// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('src/features/providers/initProviders')

// Mock Sentry crash reporting
jest.mock('@sentry/react-native', () => ({ init: () => jest.fn() }))
jest.mock('react-native-vision-camera', () => {})

// Setup Async Storage mocking: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests()
