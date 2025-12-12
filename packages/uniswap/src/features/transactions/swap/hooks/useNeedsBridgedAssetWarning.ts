import { useMemo } from 'react'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useDismissedBridgedAssetWarnings } from 'uniswap/src/features/tokens/slice/hooks'

import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { isWebApp } from 'utilities/src/platform'

export function useNeedsBridgedAssetWarning(
  derivedSwapInfo: DerivedSwapInfo,
  prefilledCurrencies?: TradeableAsset[],
): {
  needsBridgedAssetWarning: boolean
  currenciesWithBridgingWarnings: CurrencyInfo[]
} {
  const inputCurrencyInfo = derivedSwapInfo.currencies.input
  const outputCurrencyInfo = derivedSwapInfo.currencies.output

  const { tokenWarningDismissed: inputTokenWarningPreviouslyDismissed } = useDismissedBridgedAssetWarnings(
    inputCurrencyInfo?.currency,
  )
  const { tokenWarningDismissed: outputTokenWarningPreviouslyDismissed } = useDismissedBridgedAssetWarnings(
    outputCurrencyInfo?.currency,
  )

  const currenciesWithBridgingWarnings: CurrencyInfo[] = useMemo(() => {
    const tokens: CurrencyInfo[] = []

    // We only display protection warnings for prefilled tokens on swap button click, bc users should have already seen warning if picked via token selector
    const inputCurrencyId = inputCurrencyInfo && currencyId(inputCurrencyInfo.currency)
    const outputCurrencyId = outputCurrencyInfo && currencyId(outputCurrencyInfo.currency)
    const isInputPrefilled =
      inputCurrencyId &&
      prefilledCurrencies?.some((currency) => currencyId(currency).toLowerCase() === inputCurrencyId.toLowerCase())
    const isOutputPrefilled =
      outputCurrencyId &&
      prefilledCurrencies?.some((currency) => currencyId(currency).toLowerCase() === outputCurrencyId.toLowerCase())

    if (inputCurrencyInfo && !inputTokenWarningPreviouslyDismissed && isInputPrefilled && inputCurrencyInfo.isBridged) {
      tokens.push(inputCurrencyInfo)
    }
    if (
      outputCurrencyInfo &&
      !outputTokenWarningPreviouslyDismissed &&
      isOutputPrefilled &&
      outputCurrencyInfo.isBridged
    ) {
      tokens.push(outputCurrencyInfo)
    }
    return tokens
  }, [
    inputCurrencyInfo,
    outputCurrencyInfo,
    prefilledCurrencies,
    inputTokenWarningPreviouslyDismissed,
    outputTokenWarningPreviouslyDismissed,
  ])

  if (!isWebApp) {
    return {
      needsBridgedAssetWarning: false,
      currenciesWithBridgingWarnings: [],
    }
  }

  return {
    needsBridgedAssetWarning: currenciesWithBridgingWarnings.length >= 1,
    currenciesWithBridgingWarnings,
  }
}
