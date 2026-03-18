import { renderHook } from '@testing-library/react'
import type { MutableRefObject, RefObject } from 'react'
import type { TextInputProps } from 'react-native'
import type { CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import type { DecimalPadInputRef } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import { useSwapFormScreenCallbacks } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenCallbacks'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { Mock } from 'vitest'

// Mock all dependencies
vi.mock('utilities/src/platform', () => ({
  isWebPlatform: true,
  isMobileApp: false,
}))

vi.mock('utilities/src/telemetry/trace/TraceContext', () => ({
  useTrace: vi.fn(() => ({})),
}))

vi.mock('utilities/src/react/hooks', () => ({
  useEvent: vi.fn((fn) => fn),
}))

vi.mock('uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction', () => ({
  maybeLogFirstSwapAction: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/form/hooks/useDecimalPadControlledField', () => ({
  useDecimalPadControlledField: vi.fn(() => CurrencyField.INPUT),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useOnToggleIsFiatMode', () => ({
  useOnToggleIsFiatMode: vi.fn(() => vi.fn()),
}))

vi.mock('uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils', () => ({
  isMaxPercentage: vi.fn((percentage) => percentage === 'max'),
}))

// Mock the swap form store
const mockUpdateSwapForm = vi.fn()
const mockAmountUpdatedTimeRef = { current: 0 }
const mockExactAmountTokenRef = { current: '' }

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: vi.fn((selector) =>
    selector({
      amountUpdatedTimeRef: mockAmountUpdatedTimeRef,
      exactAmountTokenRef: mockExactAmountTokenRef,
      exactCurrencyField: CurrencyField.INPUT,
      focusOnCurrencyField: CurrencyField.INPUT,
      isFiatMode: true,
      input: null,
      output: null,
      updateSwapForm: mockUpdateSwapForm,
    }),
  ),
}))

describe('useSwapFormScreenCallbacks', () => {
  const createMockRefs = (): {
    formattedDerivedValueRef: MutableRefObject<string>
    inputRef: RefObject<CurrencyInputPanelRef | null>
    outputRef: RefObject<CurrencyInputPanelRef | null>
    decimalPadRef: RefObject<DecimalPadInputRef | null>
    inputSelectionRef: MutableRefObject<TextInputProps['selection']>
    outputSelectionRef: MutableRefObject<TextInputProps['selection']>
  } => ({
    formattedDerivedValueRef: { current: '' },
    inputRef: { current: null },
    outputRef: { current: null },
    decimalPadRef: { current: null },
    inputSelectionRef: { current: undefined },
    outputSelectionRef: { current: undefined },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('onSetPresetValue', () => {
    it('should set isFiatMode to false when clicking Max button', () => {
      const refs = createMockRefs()

      const { result } = renderHook(() =>
        useSwapFormScreenCallbacks({
          exactOutputWouldFailIfCurrenciesSwitched: false,
          exactFieldIsInput: true,
          isCrossChain: false,
          sameAssetBridgeDetected: false,
          ...refs,
        }),
      )

      // Simulate clicking Max button
      result.current.onSetPresetValue('100.123456', 'max')

      // Verify that updateSwapForm was called with isFiatMode: false
      expect(mockUpdateSwapForm).toHaveBeenCalledWith(
        expect.objectContaining({
          isFiatMode: false,
          exactAmountToken: '100.123456',
          isMax: true,
        }),
      )
    })

    it('should set isFiatMode to false when clicking percentage preset button', () => {
      const refs = createMockRefs()

      const { result } = renderHook(() =>
        useSwapFormScreenCallbacks({
          exactOutputWouldFailIfCurrenciesSwitched: false,
          exactFieldIsInput: true,
          isCrossChain: false,
          sameAssetBridgeDetected: false,
          ...refs,
        }),
      )

      // Simulate clicking 50% preset button
      result.current.onSetPresetValue('50.061728', 50)

      // Verify that updateSwapForm was called with isFiatMode: false
      expect(mockUpdateSwapForm).toHaveBeenCalledWith(
        expect.objectContaining({
          isFiatMode: false,
          exactAmountToken: '50.061728',
          isMax: false,
        }),
      )
    })

    it('should set exactCurrencyField to INPUT when clicking preset button', () => {
      const refs = createMockRefs()

      const { result } = renderHook(() =>
        useSwapFormScreenCallbacks({
          exactOutputWouldFailIfCurrenciesSwitched: false,
          exactFieldIsInput: true,
          isCrossChain: false,
          sameAssetBridgeDetected: false,
          ...refs,
        }),
      )

      result.current.onSetPresetValue('100', 'max')

      expect(mockUpdateSwapForm).toHaveBeenCalledWith(
        expect.objectContaining({
          exactCurrencyField: CurrencyField.INPUT,
        }),
      )
    })

    it('should clear exactAmountFiat when clicking preset button', () => {
      const refs = createMockRefs()

      const { result } = renderHook(() =>
        useSwapFormScreenCallbacks({
          exactOutputWouldFailIfCurrenciesSwitched: false,
          exactFieldIsInput: true,
          isCrossChain: false,
          sameAssetBridgeDetected: false,
          ...refs,
        }),
      )

      result.current.onSetPresetValue('100', 'max')

      expect(mockUpdateSwapForm).toHaveBeenCalledWith(
        expect.objectContaining({
          exactAmountFiat: undefined,
        }),
      )
    })
  })
})
