import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getEarnAmountInputDisplayValue,
  MAX_EARN_AMOUNT_INPUT_LENGTH,
  useEarnAmountEntryMobile,
} from 'uniswap/src/features/earn/hooks/useEarnAmountEntryMobile'
import { act, renderHook } from 'uniswap/src/test/test-utils'

const useUSDTokenUpdaterMock = vi.hoisted(() => vi.fn())

vi.mock('uniswap/src/features/gas/hooks/useMaxAmountSpend', () => ({
  useMaxAmountSpend: () => undefined,
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmount: (amount: number) => ({ amount }),
  }),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: useUSDTokenUpdaterMock,
}))

describe(useEarnAmountEntryMobile, () => {
  beforeEach(() => {
    useUSDTokenUpdaterMock.mockClear()
  })

  it('removes a trailing decimal point when truncating a display value', () => {
    expect(getEarnAmountInputDisplayValue('1234567890.1')).toBe('1234567890')
  })

  it('rejects manually entered values beyond the design input limit', () => {
    const onInputLengthExceeded = vi.fn()
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: false,
        isWithdrawLiquidityLimited: false,
        onInputLengthExceeded,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: 0,
        withdrawableBalanceUsd: 0,
      }),
    )

    act(() => result.current.setActiveAmount('12345678901'))
    expect(result.current.value).toBe('12345678901')

    act(() => result.current.setActiveAmount('123456789012'))
    expect(result.current.value).toBe('12345678901')
    expect(onInputLengthExceeded).toHaveBeenCalledTimes(1)
  })

  it('limits token values populated by fiat conversion', () => {
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: false,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: 0,
        withdrawableBalanceUsd: 0,
      }),
    )
    const updater = useUSDTokenUpdaterMock.mock.lastCall?.[0] as {
      onTokenAmountUpdated: (amount: string) => void
    }

    act(() => updater.onTokenAmountUpdated('0.051437783503687976'))
    act(() => result.current.handleToggleInputMode())

    expect(result.current.value).toBe('0.051437783')
    expect(result.current.value).toHaveLength(MAX_EARN_AMOUNT_INPUT_LENGTH)
  })

  it('limits fiat values populated by token conversion while preserving the exact amount', () => {
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: false,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: 0,
        withdrawableBalanceUsd: 0,
      }),
    )
    const updater = useUSDTokenUpdaterMock.mock.lastCall?.[0] as {
      onFiatAmountUpdated: (amount: string) => void
    }
    const exactFiatAmount = '250000000.00'

    act(() => result.current.handleToggleInputMode())
    act(() => updater.onFiatAmountUpdated(exactFiatAmount))
    act(() => result.current.handleToggleInputMode())

    expect(result.current.value).toBe(getEarnAmountInputDisplayValue(exactFiatAmount))
    expect(result.current.value).toHaveLength(MAX_EARN_AMOUNT_INPUT_LENGTH)
    expect(result.current.exactValueRef.current).toBe(result.current.value)
    expect(result.current.exactAmountFiat).toBe(exactFiatAmount)
    expect(result.current.parsedAmount).toBe(Number(exactFiatAmount))
  })

  it('limits a deposit percentage fiat value while preserving the exact amount', () => {
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: false,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: 500_000_000,
        walletBalance: 1,
        withdrawableBalanceUsd: 0,
      }),
    )

    act(() => result.current.handlePercentPress(0.25))

    expect(result.current.value).toBe('125000000.0')
    expect(result.current.value).toHaveLength(MAX_EARN_AMOUNT_INPUT_LENGTH)
    expect(result.current.exactAmountFiat).toBe('125000000.00')
    expect(result.current.parsedAmount).toBe(125_000_000)
  })

  it('limits a withdraw percentage fiat value while preserving the exact amount', () => {
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency: undefined,
        isWithdrawing: true,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: 0,
        withdrawableBalanceUsd: 250_000_000,
      }),
    )

    act(() => result.current.handlePercentPress(1))

    expect(result.current.value).toBe('250000000.0')
    expect(result.current.value).toHaveLength(MAX_EARN_AMOUNT_INPUT_LENGTH)
    expect(result.current.exactAmountFiat).toBe('250000000.00')
    expect(result.current.parsedAmount).toBe(250_000_000)
  })

  it('limits the visible Max value while preserving the exact amount for execution', () => {
    const currency = new Token(
      UniverseChainId.Mainnet,
      '0x0000000000000000000000000000000000000001',
      18,
      'TEST',
      'Test Token',
    )
    const exactBalance = '0.051437783503687976'
    const { result } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency,
        isWithdrawing: false,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: Number(exactBalance),
        walletBalanceRaw: '51437783503687976',
        withdrawableBalanceUsd: 0,
      }),
    )

    act(() => result.current.handlePercentPress(1))

    expect(result.current.value).toBe('0.051437783')
    expect(result.current.value).toHaveLength(MAX_EARN_AMOUNT_INPUT_LENGTH)
    expect(result.current.exactMaxTokenAmount).toBe(exactBalance)
    expect(result.current.isMaxSelected).toBe(true)
  })

  it('clears the deposit Max token amount when switching to a Max withdrawal', () => {
    const exactBalance = '0.051437783503687976'
    const currency = new Token(
      UniverseChainId.Mainnet,
      '0x0000000000000000000000000000000000000001',
      18,
      'TEST',
      'Test Token',
    )
    let isWithdrawing = false
    const { result, rerender } = renderHook(() =>
      useEarnAmountEntryMobile({
        currency,
        isWithdrawing,
        isWithdrawLiquidityLimited: false,
        selectedDepositSourceBalanceUsd: undefined,
        walletBalance: Number(exactBalance),
        walletBalanceRaw: '51437783503687976',
        withdrawableBalanceUsd: 100,
      }),
    )

    act(() => result.current.handlePercentPress(1))
    expect(result.current.exactMaxTokenAmount).toBe(exactBalance)

    isWithdrawing = true
    rerender()
    act(() => result.current.handlePercentPress(1))

    expect(result.current.isMaxSelected).toBe(true)
    expect(result.current.exactMaxTokenAmount).toBeUndefined()
  })

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
    const updater = useUSDTokenUpdaterMock.mock.lastCall?.[0] as {
      onTokenAmountUpdated: (amount: string) => void
    }

    act(() => result.current.handlePercentPress(1))
    expect(result.current.exactAmountFiat).toBe('100.00')
    expect(result.current.isMaxSelected).toBe(true)

    // The unit switch requires a settled counterpart conversion.
    act(() => updater.onTokenAmountUpdated('0.05'))
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
    expect(result.current.exactMaxTokenAmount).toBeUndefined()
    expect(result.current.value).toBe('')
  })

  it('does not switch input modes while the counterpart conversion is unresolved', () => {
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
    const updater = useUSDTokenUpdaterMock.mock.lastCall?.[0] as {
      onTokenAmountUpdated: (amount: string) => void
    }

    act(() => result.current.handlePercentPress(1))
    expect(result.current.exactAmountFiat).toBe('100.00')

    // Pending conversion: switching would promote an empty value over the typed amount.
    act(() => result.current.handleToggleInputMode())
    expect(result.current.isFiatInput).toBe(true)
    expect(result.current.value).toBe('100.00')

    act(() => updater.onTokenAmountUpdated('0.05'))
    act(() => result.current.handleToggleInputMode())
    expect(result.current.isFiatInput).toBe(false)
    expect(result.current.value).toBe('0.05')
  })
})
