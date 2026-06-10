import type { Currency } from '@uniswap/sdk-core'
import type { MutableRefObject } from 'react'
import { useCallback, useRef, useState } from 'react'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { getEarnFiatPercentageInput, getEarnPercentageInput } from 'uniswap/src/features/earn/amount'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'

type UseEarnAmountEntryMobileParams = {
  currency: Currency | undefined
  isWithdrawing: boolean
  initialAmount?: string
  walletBalance: number
  selectedDepositSourceBalanceUsd: number | undefined
  positionBalanceUsd: number
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
  setActiveAmount: (next: string) => void
  handlePercentPress: (pct: number) => void
  handleToggleInputMode: () => void
}

// This hook is currently mobile-only — the `useUSDTokenUpdater` state-cycle conversion model
// doesn't match the web flow's imperative `useFiatTokenConversion`. The `Mobile` suffix is a
// signal not to import this on web without first generalizing the conversion strategy.
export function useEarnAmountEntryMobile({
  currency,
  isWithdrawing,
  initialAmount,
  walletBalance,
  selectedDepositSourceBalanceUsd,
  positionBalanceUsd,
}: UseEarnAmountEntryMobileParams): UseEarnAmountEntryMobileResult {
  const { convertFiatAmount } = useLocalizationContext()
  const [exactAmountFiat, setExactAmountFiat, exactAmountFiatRef] = useStateWithRef(initialAmount ?? '')
  const [exactAmountToken, setExactAmountToken, exactAmountTokenRef] = useStateWithRef('')
  const [isFiatInput, setIsFiatInput] = useState(true)

  const exactValueRef = isFiatInput ? exactAmountFiatRef : exactAmountTokenRef
  const value = isFiatInput ? exactAmountFiat : exactAmountToken
  const maxDecimals = isFiatInput ? MAX_FIAT_INPUT_DECIMALS : (currency?.decimals ?? 0)

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
    },
    [isFiatInput, setExactAmountFiat, setExactAmountToken],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const convertUsdToLocalFiat = (balanceUsd: number): number => convertFiatAmount(balanceUsd).amount
      if (isWithdrawing) {
        const fiatAmount = getEarnFiatPercentageInput({
          balanceUsd: positionBalanceUsd,
          convertUsdToLocalFiat,
          fiatDecimals: MAX_FIAT_INPUT_DECIMALS,
          percentage: pct,
        })
        setExactAmountFiat(fiatAmount)
        setIsFiatInput(true)
        return
      }

      const percentageInput = getEarnPercentageInput({
        balanceQuantity: walletBalance,
        balanceUsd: selectedDepositSourceBalanceUsd,
        convertUsdToLocalFiat,
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
      positionBalanceUsd,
      selectedDepositSourceBalanceUsd,
      setExactAmountFiat,
      setExactAmountToken,
      walletBalance,
    ],
  )

  const handleToggleInputMode = useCallback(() => {
    // Refs already track current state via setExactAmount*; no manual sync needed.
    setIsFiatInput((prev) => !prev)
  }, [])

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
    setActiveAmount,
    handlePercentPress,
    handleToggleInputMode,
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
