import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { FiatOnRampActionModal } from 'src/components/home/FiatOnRampActionModal'
import { preloadedMobileState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import type { Mock } from 'vitest'

const mockOnClose = vi.fn()

vi.mock('src/components/modals/useReactNavigationModal', () => ({
  useReactNavigationModal: (): { onClose: Mock; preventCloseRef: { current: boolean } } => ({
    onClose: mockOnClose,
    preventCloseRef: { current: false },
  }),
}))

vi.mock('src/app/navigation/rootNavigation', () => ({
  navigate: vi.fn(),
}))

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: vi.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: vi.fn().mockReturnValue(false),
}))

const mockDispatch = vi.fn()
vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: (): Mock => mockDispatch,
}))

function createProps(entry: 'onramp' | 'offramp'): AppStackScreenProp<typeof ModalName.FiatOnRampAction> {
  return {
    navigation: {
      navigate: vi.fn(),
      goBack: vi.fn(),
    } as unknown as AppStackScreenProp<typeof ModalName.FiatOnRampAction>['navigation'],
    route: {
      key: 'fiat-on-ramp-action',
      name: ModalName.FiatOnRampAction,
      params: { entry },
    },
  }
}

describe('FiatOnRampActionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render Buy variant with correct text', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('onramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      expect(getByText('fiatOnRamp.action.buyWithCash')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.buyWithCash.description')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.swapTokens')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.swapTokens.description')).toBeTruthy()
    })

    it('should render Sell variant with correct text', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('offramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      expect(getByText('fiatOnRamp.action.sellForCash')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.sellForCash.description')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.swapTokens')).toBeTruthy()
      expect(getByText('fiatOnRamp.action.swapTokens.description')).toBeTruthy()
    })
  })

  describe('Buy variant behavior', () => {
    it('should close modal and open FiatOnRampAggregator when pressing buy with cash', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('onramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      fireEvent.press(getByText('fiatOnRamp.action.buyWithCash'), ON_PRESS_EVENT_PAYLOAD)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            name: ModalName.FiatOnRampAggregator,
          }),
        }),
      )
      // Should NOT have isOfframp in the payload for onramp
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            initialState: expect.objectContaining({ isOfframp: true }),
          }),
        }),
      )
    })

    it('should close modal and navigate to Swap when pressing swap tokens', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('onramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      fireEvent.press(getByText('fiatOnRamp.action.swapTokens'), ON_PRESS_EVENT_PAYLOAD)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(ModalName.Swap)
    })
  })

  describe('Sell variant behavior', () => {
    it('should close modal and open FiatOnRampAggregator with isOfframp when pressing sell for cash', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('offramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      fireEvent.press(getByText('fiatOnRamp.action.sellForCash'), ON_PRESS_EVENT_PAYLOAD)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            name: ModalName.FiatOnRampAggregator,
            initialState: { isOfframp: true },
          }),
        }),
      )
    })
  })
})
