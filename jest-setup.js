// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('src/chains/initProviders')
jest.mock('@sentry/react-native', () => ({ init: () => jest.fn() }))
jest.mock('react-native-vision-camera', () => {})
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests()
