import { DdRum } from '@datadog/mobile-react-native'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { SwapModal } from 'src/app/modals/SwapModal'
import { persistedReducer } from 'src/app/store'
import { preloadedMobileState, preloadedModalsState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

// Mock dependencies to avoid type errors
jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: {
    startView: jest.fn().mockResolvedValue(undefined),
    stopView: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock required modules with simpler implementation
jest.mock('wallet/src/features/transactions/swap/WalletSwapFlow', () => ({
  WalletSwapFlow: function MockWalletSwapFlow(): string {
    return 'MockedWalletSwapFlow'
  },
}))

// Simple tests to boost code coverage
describe('SwapModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    const preloadedState = preloadedMobileState({
      modals: preloadedModalsState({
        [ModalName.Swap]: { isOpen: true },
      }),
    })

    // Create a test store with serialization check disabled
    const store = configureStore({
      reducer: persistedReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable serialization check for tests
        }).concat(fiatOnRampAggregatorApi.middleware),
    })

    const tree = renderWithProviders(<SwapModal />, {
      preloadedState,
      store,
    })
    expect(tree.toJSON()).toBeTruthy()
  })

  it('starts DataDog view on mount', () => {
    const preloadedState = preloadedMobileState({
      modals: preloadedModalsState({
        [ModalName.Swap]: { isOpen: true },
      }),
    })

    // Create a test store with serialization check disabled
    const store = configureStore({
      reducer: persistedReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable serialization check for tests
        }).concat(fiatOnRampAggregatorApi.middleware),
    })

    renderWithProviders(<SwapModal />, {
      preloadedState,
      store,
    })
    expect(DdRum.startView).toHaveBeenCalled()
  })
})
