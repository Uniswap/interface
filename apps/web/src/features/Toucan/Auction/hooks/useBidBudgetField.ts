import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice, useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { useEvent } from 'utilities/src/react/hooks'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'

// Used for rounding in conversion math
const NUM_DECIMALS_FIAT_ROUNDING = 2

// Used for display text on fiat amount
const NUM_DECIMALS_DISPLAY_FIAT = 2

export interface BudgetFieldState {
  currencyAmount: CurrencyAmount<Currency> | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  usdValue: CurrencyAmount<Currency> | null
  value: string
  isFiatMode: boolean
  onChange: (amount: string) => void
  onSelectPreset: (amount: string) => void
  onToggleFiatMode: () => void
}

interface UseBidBudgetFieldParams {
  bidCurrency: Currency | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  onInputChange?: () => void
}

interface UseBidBudgetFieldResult {
  budgetField: BudgetFieldState
  exactBudgetAmount: string
  budgetCurrencyAmount: CurrencyAmount<Currency> | undefined
  budgetAmountIsZero: boolean
  resetBudgetField: () => void
}

export function useBidBudgetField({
  bidCurrency,
  currencyBalance,
  currencyInfo,
  onInputChange,
}: UseBidBudgetFieldParams): UseBidBudgetFieldResult {
  const [exactBudgetAmountToken, setExactBudgetAmountToken] = useState('')
  const [exactBudgetAmountFiat, setExactBudgetAmountFiat] = useState('')
  const [isBudgetFiatMode, setIsBudgetFiatMode] = useState(false)

  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const chainId = bidCurrency?.chainId

  const budgetCurrencyAmount = tryParseCurrencyAmount(exactBudgetAmountToken, bidCurrency)
  const budgetUsdValue = useUSDCValue(budgetCurrencyAmount)
  const { price: usdPriceOfCurrency } = useUSDCPrice(bidCurrency ?? undefined)

  // Sync fiat ↔ token amounts
  useEffect(() => {
    if (!bidCurrency || !usdPriceOfCurrency || !chainId) {
      return
    }

    if (isBudgetFiatMode) {
      // Convert fiat → token
      const fiatAmount =
        exactBudgetAmountFiat && !isNaN(parseFloat(exactBudgetAmountFiat)) ? parseFloat(exactBudgetAmountFiat) : 0
      const usdAmount = (fiatAmount / conversionRate).toFixed(NUM_DECIMALS_FIAT_ROUNDING)
      const stablecoinAmount = getCurrencyAmount({
        value: usdAmount,
        valueType: ValueType.Exact,
        currency: getPrimaryStablecoin(chainId),
      })
      const tokenAmount = stablecoinAmount ? usdPriceOfCurrency.invert().quote(stablecoinAmount) : undefined
      setExactBudgetAmountToken(tokenAmount?.toExact() ?? '')
    }

    // When in token mode, sync token → fiat
    if (!isBudgetFiatMode) {
      // Convert token → fiat
      const tokenAmount = getCurrencyAmount({
        value: exactBudgetAmountToken,
        valueType: ValueType.Exact,
        currency: bidCurrency,
      })
      const usdAmount = tokenAmount ? usdPriceOfCurrency.quote(tokenAmount) : undefined
      const fiatAmount = parseFloat(usdAmount?.toExact() ?? '0') * conversionRate
      const fiatAmountFormatted = fiatAmount ? fiatAmount.toFixed(NUM_DECIMALS_DISPLAY_FIAT) : ''
      setExactBudgetAmountFiat(fiatAmountFormatted)
    }
  }, [
    exactBudgetAmountFiat,
    exactBudgetAmountToken,
    bidCurrency,
    conversionRate,
    chainId,
    usdPriceOfCurrency,
    isBudgetFiatMode,
  ])

  const onToggleBudgetFiatMode = useEvent(() => {
    setIsBudgetFiatMode((prev) => !prev)
  })

  const onChangeBudgetAmount = useEvent((amount: string) => {
    if (isBudgetFiatMode) {
      setExactBudgetAmountFiat(amount)
    } else {
      setExactBudgetAmountToken(amount)
    }
    onInputChange?.()
  })

  const onSetBudgetPresetValue = useEvent((amount: string) => {
    setIsBudgetFiatMode(false)
    setExactBudgetAmountToken(amount)
    onInputChange?.()
  })

  const resetBudgetField = useEvent(() => {
    setExactBudgetAmountToken('')
    setExactBudgetAmountFiat('')
    setIsBudgetFiatMode(false)
  })

  const budgetAmountIsZero = budgetCurrencyAmount?.equalTo(0) ?? true

  // Display value based on mode
  const displayValue = isBudgetFiatMode ? exactBudgetAmountFiat : exactBudgetAmountToken

  return {
    budgetField: {
      currencyAmount: budgetCurrencyAmount,
      currencyBalance,
      currencyInfo,
      usdValue: budgetUsdValue,
      value: displayValue,
      isFiatMode: isBudgetFiatMode,
      onChange: onChangeBudgetAmount,
      onSelectPreset: onSetBudgetPresetValue,
      onToggleFiatMode: onToggleBudgetFiatMode,
    },
    exactBudgetAmount: exactBudgetAmountToken,
    budgetCurrencyAmount,
    budgetAmountIsZero,
    resetBudgetField,
  }
}
