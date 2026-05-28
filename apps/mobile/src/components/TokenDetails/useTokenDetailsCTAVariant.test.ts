import { renderHook } from '@testing-library/react'
import { useMultichainBuyVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { Bank } from 'ui/src/components/icons'

const defaultHandlers = {
  onPressBuyWithCash: jest.fn(),
  onPressGet: jest.fn(),
  onPressBuy: jest.fn(),
}

const defaultParams = {
  hasTokenBalance: false,
  isNativeCurrency: false,
  nativeFiatOnRampCurrency: undefined,
  fiatOnRampCurrency: undefined,
  bridgingTokenWithHighestBalance: undefined,
  hasZeroGasBalance: undefined,
  tokenSymbol: 'UNI',
  ...defaultHandlers,
}

describe(useMultichainBuyVariant, () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return onPressBuy with no custom title when user has balance', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        hasTokenBalance: true,
      }),
    )

    expect(result.current.title).toBeUndefined()
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuy)
  })

  it('should return "Buy with cash" with Bank icon when fiat on-ramp supported and no bridging token', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        fiatOnRampCurrency: { symbol: 'UNI' },
      }),
    )

    expect(result.current.title).toBe('Buy with cash')
    expect(result.current.icon).toBe(Bank)
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuyWithCash)
  })

  it('should return "Buy with cash" with Bank icon for native currency with native fiat on-ramp support', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        isNativeCurrency: true,
        nativeFiatOnRampCurrency: { symbol: 'ETH' },
      }),
    )

    expect(result.current.title).toBe('Buy with cash')
    expect(result.current.icon).toBe(Bank)
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuyWithCash)
  })

  it('should return "Get {token}" when non-native with zero native balance', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        isNativeCurrency: false,
        hasZeroGasBalance: true,
        tokenSymbol: 'UNI',
      }),
    )

    expect(result.current.title).toBe('Get UNI')
    expect(result.current.onPress).toBe(defaultHandlers.onPressGet)
  })

  it('should return fallback "Get Token" when symbol is undefined', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        isNativeCurrency: false,
        hasZeroGasBalance: true,
        tokenSymbol: undefined,
      }),
    )

    expect(result.current.title).toBe('Get Token')
    expect(result.current.onPress).toBe(defaultHandlers.onPressGet)
  })

  it('should prefer "Buy with cash" over "Get {token}" when both conditions match', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        fiatOnRampCurrency: { symbol: 'UNI' },
        isNativeCurrency: false,
        hasZeroGasBalance: true,
      }),
    )

    expect(result.current.title).toBe('Buy with cash')
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuyWithCash)
  })

  it('should return "Get {token}" when native currency with zero balance', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        isNativeCurrency: true,
        hasZeroGasBalance: true,
        tokenSymbol: 'MON',
      }),
    )

    expect(result.current.title).toBe('Get MON')
    expect(result.current.onPress).toBe(defaultHandlers.onPressGet)
  })

  it('should fall back to onPressBuy when no special conditions match', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        isNativeCurrency: true,
        hasZeroGasBalance: false,
      }),
    )

    expect(result.current.title).toBeUndefined()
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuy)
  })

  it('should fall back to onPressBuy when on-ramp is supported but bridging token exists', () => {
    const { result } = renderHook(() =>
      useMultichainBuyVariant({
        ...defaultParams,
        fiatOnRampCurrency: { symbol: 'UNI' },
        bridgingTokenWithHighestBalance: { balance: 100 },
      }),
    )

    expect(result.current.title).toBeUndefined()
    expect(result.current.onPress).toBe(defaultHandlers.onPressBuy)
  })
})
