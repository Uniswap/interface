// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

// mock initProviders to avoid creating real ethers providers for each test
jest.mock('src/chains/initProviders')
