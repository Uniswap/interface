import { useEarnAmountEntryMobile } from 'uniswap/src/features/earn/hooks/useEarnAmountEntryMobile'
import { act, renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/gas/hooks/useMaxAmountSpend', () => ({
  useMaxAmountSpend: () => undefined,
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmount: (amount: number) => ({ amount }),
  }),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: () => undefined,
}))

describe(useEarnAmountEntryMobile, () => {
  it('clears both amount modes and input flags', () => {
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: true,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: 0,
        withdrawableBalanceUsd: 100,
      }),
    )

    act(() => result.current.handlePercentPress(1))
    expect(result.current.exactAmountFiat).toBe('100.00')
    expect(result.current.isMaxSelected).toBe(true)

    act(() => result.current.handleToggleInputMode())
    act(() => result.current.setActiveAmount('3'))
    expect(result.current.exactAmountToken).toBe('3')
    expect(result.current.isFiatInput).toBe(false)

    act(() => result.current.resetAmounts())

    expect(result.current.exactAmountFiat).toBe('')
    expect(result.current.exactAmountToken).toBe('')
    expect(result.current.exactValueRef.current).toBe('')
    expect(result.current.isFiatInput).toBe(true)
    expect(result.current.isMaxSelected).toBe(false)
    expect(result.current.value).toBe('')
  })
})
