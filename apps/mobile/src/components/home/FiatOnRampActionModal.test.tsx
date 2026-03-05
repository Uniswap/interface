import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { FiatOnRampActionModal } from 'src/components/home/FiatOnRampActionModal'
import { preloadedMobileState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'

const mockOnClose = jest.fn()

jest.mock('src/components/modals/useReactNavigationModal', () => ({
  useReactNavigationModal: (): { onClose: jest.Mock; preventCloseRef: { current: boolean } } => ({
    onClose: mockOnClose,
    preventCloseRef: { current: false },
  }),
}))

jest.mock('src/app/navigation/rootNavigation', () => ({
  navigate: jest.fn(),
}))

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: jest.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: jest.fn().mockReturnValue(false),
}))

const mockDispatch = jest.fn()
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: (): jest.Mock => mockDispatch,
}))

function createProps(entry: 'onramp' | 'offramp'): AppStackScreenProp<typeof ModalName.FiatOnRampAction> {
  return {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
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
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render Buy variant with correct text', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('onramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      expect(getByText('Buy with cash')).toBeTruthy()
      expect(getByText('Use a debit card or bank account')).toBeTruthy()
      expect(getByText('Swap tokens')).toBeTruthy()
      expect(getByText('Trade using your existing balance')).toBeTruthy()
    })

    it('should render Sell variant with correct text', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('offramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      expect(getByText('Sell for cash')).toBeTruthy()
      expect(getByText('Withdraw to a debit card or bank')).toBeTruthy()
      expect(getByText('Swap tokens')).toBeTruthy()
      expect(getByText('Trade using your existing balance')).toBeTruthy()
    })
  })

  describe('Buy variant behavior', () => {
    it('should close modal and open FiatOnRampAggregator when pressing buy with cash', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('onramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      fireEvent.press(getByText('Buy with cash'), ON_PRESS_EVENT_PAYLOAD)

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

      fireEvent.press(getByText('Swap tokens'), ON_PRESS_EVENT_PAYLOAD)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(ModalName.Swap)
    })
  })

  describe('Sell variant behavior', () => {
    it('should close modal and open FiatOnRampAggregator with isOfframp when pressing sell for cash', () => {
      const { getByText } = renderWithProviders(<FiatOnRampActionModal {...createProps('offramp')} />, {
        preloadedState: preloadedMobileState({}),
      })

      fireEvent.press(getByText('Sell for cash'), ON_PRESS_EVENT_PAYLOAD)

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
