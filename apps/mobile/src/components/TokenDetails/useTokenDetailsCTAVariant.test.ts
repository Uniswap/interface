import { renderHook } from '@testing-library/react'
import { useTokenDetailsCTAVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { CurrencyField } from 'uniswap/src/types/currency'

const mockOnPress = jest.fn()

const defaultParams = {
  hasTokenBalance: false,
  isNativeCurrency: false,
  nativeFiatOnRampCurrency: undefined,
  fiatOnRampCurrency: undefined,
  bridgingTokenWithHighestBalance: undefined,
  hasZeroNativeBalance: false,
  tokenSymbol: 'UNI',
  onPressBuyFiatOnRamp: mockOnPress,
  onPressGet: mockOnPress,
  onPressSwap: mockOnPress,
}

describe('useTokenDetailsCTAVariant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Token Details CTA variant', () => {
    it('returns Buy button when no token balance, is native currency, supports fiat on-ramp and no bridging tokens', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: true,
          fiatOnRampCurrency: {},
          bridgingTokenWithHighestBalance: undefined,
        }),
      )
      expect(result.current.title).toBe('Buy')
    })

    it('returns Buy button when no token balance, supports fiat on-ramp and no bridging tokens', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: false,
          fiatOnRampCurrency: {},
          bridgingTokenWithHighestBalance: undefined,
        }),
      )
      expect(result.current.title).toBe('Buy')
    })

    it('returns Get button when no token balance, not native currency, and has zero native balance', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: false,
          hasZeroNativeBalance: true,
          tokenSymbol: 'ABC',
        }),
      )
      expect(result.current.title).toBe('Get ABC')
    })

    it('returns Get Token fallback when no token symbol', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: false,
          hasZeroNativeBalance: true,
          tokenSymbol: undefined,
        }),
      )
      expect(result.current.title).toBe('Get Token')
    })

    it('returns Swap button when no token balance, is native currency, supports fiat on-ramp and has bridging token', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: true,
          fiatOnRampCurrency: {},
          bridgingTokenWithHighestBalance: {},
        }),
      )
      expect(result.current.title).toBe('Swap')
    })

    it('returns Swap button if not FOR currency', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
          isNativeCurrency: false,
        }),
      )
      expect(result.current.title).toBe('Swap')
    })

    it('returns Swap button when user has token balance', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: true,
        }),
      )
      expect(result.current.title).toBe('Swap')
    })

    it('returns Swap button as default when no other conditions met', () => {
      const { result } = renderHook(() => useTokenDetailsCTAVariant(defaultParams))
      expect(result.current.title).toBe('Swap')
    })

    it('passes CurrencyField.INPUT to swap function when user has token balance', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: true,
        }),
      )

      result.current.onPress()
      expect(mockOnPress).toHaveBeenCalledWith(CurrencyField.INPUT)
    })

    it('passes CurrencyField.OUTPUT to swap function when user has no token balance', () => {
      const { result } = renderHook(() =>
        useTokenDetailsCTAVariant({
          ...defaultParams,
          hasTokenBalance: false,
        }),
      )

      result.current.onPress()
      expect(mockOnPress).toHaveBeenCalledWith(CurrencyField.OUTPUT)
    })
  })
})
