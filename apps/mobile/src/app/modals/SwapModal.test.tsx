import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { SwapModal } from 'src/app/modals/SwapModal'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { persistedReducer } from 'src/app/store'
import { preloadedMobileState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

// Mock required modules with simpler implementation
jest.mock('wallet/src/features/transactions/swap/WalletSwapFlow', () => ({
  WalletSwapFlow: function MockWalletSwapFlow(): string {
    return 'MockedWalletSwapFlow'
  },
}))

// Simple tests to boost code coverage
describe('SwapModal', () => {
  const mockProps: AppStackScreenProp<typeof ModalName.Swap> = {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
    } as unknown as AppStackScreenProp<typeof ModalName.Swap>['navigation'],
    route: {
      key: 'swap-modal',
      name: ModalName.Swap,
      params: undefined,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    const preloadedState = preloadedMobileState({})

    // Create a test store with serialization check disabled
    const store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable serialization check for tests
        }).concat(fiatOnRampAggregatorApi.middleware),
    })

    const tree = renderWithProviders(<SwapModal {...mockProps} />, {
      preloadedState,
      store,
    })
    expect(tree.toJSON()).toBeTruthy()
  })
})
