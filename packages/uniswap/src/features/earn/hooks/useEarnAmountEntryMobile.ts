import type { Currency } from '@uniswap/sdk-core'
import type { MutableRefObject } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import {
  getEarnDepositPercentageInput,
  getEarnFiatPercentageInput,
  getMaxDepositTokenAmount,
} from 'uniswap/src/features/earn/amount'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

type UseEarnAmountEntryMobileParams = {
  currency: Currency | undefined
  isWithdrawing: boolean
  initialAmount?: string
  walletBalance: number
  walletBalanceRaw?: string
  selectedDepositSourceBalanceUsd: number | undefined
  withdrawableBalanceUsd: number
  isWithdrawLiquidityLimited: boolean
}

type UseEarnAmountEntryMobileResult = {
  value: string
  exactValueRef: MutableRefObject<string>
  exactAmountFiat: string
  exactAmountToken: string
  isFiatInput: boolean
  maxDecimals: number
  parsedAmount: number
  hasInputAmount: boolean
  tokenComparisonAmount: number | undefined
  localFiatComparisonAmount: number | undefined
  isMaxSelected: boolean
  setActiveAmount: (next: string) => void
  handlePercentPress: (pct: number) => void
  handleToggleInputMode: () => void
  resetAmounts: () => void
}

// This hook is currently mobile-only — the `useUSDTokenUpdater` state-cycle conversion model
// doesn't match the web flow's imperative `useFiatTokenConversion`. The `Mobile` suffix is a
// signal not to import this on web without first generalizing the conversion strategy.
export function useEarnAmountEntryMobile({
  currency,
  isWithdrawing,
  initialAmount,
  walletBalance,
  walletBalanceRaw,
  selectedDepositSourceBalanceUsd,
  withdrawableBalanceUsd,
  isWithdrawLiquidityLimited,
}: UseEarnAmountEntryMobileParams): UseEarnAmountEntryMobileResult {
  const { convertFiatAmount } = useLocalizationContext()
  const [exactAmountFiat, setExactAmountFiat, exactAmountFiatRef] = useStateWithRef(initialAmount ?? '')
  const [exactAmountToken, setExactAmountToken, exactAmountTokenRef] = useStateWithRef('')
  const [isFiatInput, setIsFiatInput] = useState(true)
  const [isMaxSelected, setIsMaxSelected] = useState(false)

  const exactValueRef = isFiatInput ? exactAmountFiatRef : exactAmountTokenRef
  const value = isFiatInput ? exactAmountFiat : exactAmountToken
  const maxDecimals = isFiatInput ? MAX_FIAT_INPUT_DECIMALS : (currency?.decimals ?? 0)
  const walletBalanceAmount = useMemo(
    () =>
      currency
        ? getCurrencyAmount({
            value: walletBalanceRaw ?? walletBalance.toFixed(currency.decimals),
            valueType: walletBalanceRaw ? ValueType.Raw : ValueType.Exact,
            currency,
          })
        : undefined,
    [currency, walletBalance, walletBalanceRaw],
  )
  const maxSpendableAmount = useMaxAmountSpend({
    currencyAmount: walletBalanceAmount,
    txType: TransactionType.Deposit,
  })
  const maxDepositTokenAmount = useMemo(() => {
    if (!currency) {
      return undefined
    }

    if (currency.isNative && maxSpendableAmount) {
      return maxSpendableAmount.toExact()
    }

    return getMaxDepositTokenAmount({
      balanceQuantity: walletBalance,
      balanceRaw: walletBalanceRaw,
      currency,
    })
  }, [currency, maxSpendableAmount, walletBalance, walletBalanceRaw])

  useUSDTokenUpdater({
    isFiatInput,
    exactAmountFiat,
    exactAmountToken,
    currency,
    onFiatAmountUpdated: setExactAmountFiat,
    onTokenAmountUpdated: setExactAmountToken,
  })

  const setActiveAmount = useCallback(
    (next: string) => {
      if (isFiatInput) {
        setExactAmountFiat(next)
      } else {
        setExactAmountToken(next)
      }
      setIsMaxSelected(false)
    },
    [isFiatInput, setExactAmountFiat, setExactAmountToken],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const convertUsdToLocalFiat = (balanceUsd: number): number => convertFiatAmount(balanceUsd).amount
      setIsMaxSelected(pct === 1)
      if (isWithdrawing) {
        const fiatAmount = getEarnFiatPercentageInput({
          balanceUsd: withdrawableBalanceUsd,
          convertUsdToLocalFiat,
          fiatDecimals: MAX_FIAT_INPUT_DECIMALS,
          percentage: pct,
          rounding: pct === 1 && isWithdrawLiquidityLimited ? 'down' : 'nearest',
        })
        setExactAmountFiat(fiatAmount)
        setIsFiatInput(true)
        return
      }

      const percentageInput = getEarnDepositPercentageInput({
        balanceQuantity: walletBalance,
        balanceUsd: selectedDepositSourceBalanceUsd,
        convertUsdToLocalFiat,
        exactMaxTokenAmount: maxDepositTokenAmount,
        fiatDecimals: MAX_FIAT_INPUT_DECIMALS,
        percentage: pct,
        tokenDecimals: currency?.decimals ?? MAX_FIAT_INPUT_DECIMALS,
      })
      setExactAmountToken(percentageInput.exactAmountToken)
      setExactAmountFiat(percentageInput.exactAmountFiat)
      setIsFiatInput(percentageInput.inputInFiat)
    },
    [
      convertFiatAmount,
      currency?.decimals,
      isWithdrawing,
      isWithdrawLiquidityLimited,
      maxDepositTokenAmount,
      selectedDepositSourceBalanceUsd,
      setExactAmountFiat,
      setExactAmountToken,
      withdrawableBalanceUsd,
      walletBalance,
    ],
  )

  const handleToggleInputMode = useCallback(() => {
    // Refs already track current state via setExactAmount*; no manual sync needed.
    setIsFiatInput((prev) => !prev)
  }, [])

  const resetAmounts = useCallback(() => {
    setExactAmountFiat('')
    setExactAmountToken('')
    setIsFiatInput(true)
    setIsMaxSelected(false)
  }, [setExactAmountFiat, setExactAmountToken])

  const parsedAmount = Number(value) || 0
  const hasInputAmount = parsedAmount > 0
  const tokenComparisonAmount = getComparisonAmount({
    parsedAmount,
    hasInputAmount,
    isPrimary: !isFiatInput,
    alternate: exactAmountToken,
  })
  const localFiatComparisonAmount = getComparisonAmount({
    parsedAmount,
    hasInputAmount,
    isPrimary: isFiatInput,
    alternate: exactAmountFiat,
  })

  return {
    value,
    exactValueRef,
    exactAmountFiat,
    exactAmountToken,
    isFiatInput,
    maxDecimals,
    parsedAmount,
    hasInputAmount,
    tokenComparisonAmount,
    localFiatComparisonAmount,
    isMaxSelected,
    setActiveAmount,
    handlePercentPress,
    handleToggleInputMode,
    resetAmounts,
  }
}

// A `useState` that also tracks the latest value in a ref. The ref reflects the value passed to
// the setter synchronously — useful for callers that need the post-render value (e.g. decimal-pad
// keystrokes that fire before React commits the new state).
function useStateWithRef<T>(initial: T): [T, (next: T) => void, MutableRefObject<T>] {
  const [value, setValue] = useState<T>(initial)
  const ref = useRef<T>(initial)
  const setBoth = useCallback((next: T) => {
    ref.current = next
    setValue(next)
  }, [])
  return [value, setBoth, ref]
}

// When the requested unit matches the user's input unit, the parsed value is the comparison amount.
// Otherwise we read the conversion-derived alternate string: a present value means the conversion has
// settled, an empty string while typing means the conversion is pending (returned as `undefined` so
// callers can show a loading state instead of treating it as zero).
function getComparisonAmount({
  parsedAmount,
  hasInputAmount,
  isPrimary,
  alternate,
}: {
  parsedAmount: number
  hasInputAmount: boolean
  isPrimary: boolean
  alternate: string
}): number | undefined {
  if (isPrimary) {
    return parsedAmount
  }
  if (alternate) {
    return Number(alternate)
  }
  return hasInputAmount ? undefined : 0
}
