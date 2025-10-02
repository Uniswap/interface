import { useMemo } from 'react'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'

import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { isWebApp } from 'utilities/src/platform'

/*
 * Display token protection warning modal on swap button click.
 * For **interface use only**, where the swap component might be prefilled with a token that has a protection warning.
 * i.e. via TDP swap component or URL /swap?inputCurrency=0x123
 * In mobile & extension, token protection warnings for prefilled tokens are already surfaced earlier on, on the previous Buy/Sell button click.
 */
export function usePrefilledNeedsTokenProtectionWarning(
  derivedSwapInfo: DerivedSwapInfo,
  prefilledCurrencies?: TradeableAsset[],
): {
  needsTokenProtectionWarning: boolean
  currenciesWithProtectionWarnings: CurrencyInfo[]
} {
  const inputCurrencyInfo = derivedSwapInfo.currencies.input
  const outputCurrencyInfo = derivedSwapInfo.currencies.output

  const { tokenWarningDismissed: inputTokenWarningPreviouslyDismissed } = useDismissedTokenWarnings(
    inputCurrencyInfo?.currency,
  )
  const { tokenWarningDismissed: outputTokenWarningPreviouslyDismissed } = useDismissedTokenWarnings(
    outputCurrencyInfo?.currency,
  )

  const currenciesWithProtectionWarnings: CurrencyInfo[] = useMemo(() => {
    const tokens: CurrencyInfo[] = []

    // We only display protection warnings for prefilled tokens on swap button click, bc users should have already seen warning if picked via token selector
    const inputCurrencyId = inputCurrencyInfo && currencyId(inputCurrencyInfo.currency)
    const outputCurrencyId = outputCurrencyInfo && currencyId(outputCurrencyInfo.currency)
    const isInputPrefilled =
      inputCurrencyId &&
      prefilledCurrencies?.some((currency) => areCurrencyIdsEqual(currencyId(currency), inputCurrencyId))
    const isOutputPrefilled =
      outputCurrencyId &&
      prefilledCurrencies?.some((currency) => areCurrencyIdsEqual(currencyId(currency), outputCurrencyId))

    if (
      inputCurrencyInfo &&
      !inputTokenWarningPreviouslyDismissed &&
      isInputPrefilled &&
      getTokenWarningSeverity(inputCurrencyInfo) !== WarningSeverity.None
    ) {
      tokens.push(inputCurrencyInfo)
    }
    if (
      outputCurrencyInfo &&
      !outputTokenWarningPreviouslyDismissed &&
      isOutputPrefilled &&
      getTokenWarningSeverity(outputCurrencyInfo) !== WarningSeverity.None
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
      needsTokenProtectionWarning: false,
      currenciesWithProtectionWarnings: [],
    }
  }
  return {
    needsTokenProtectionWarning: currenciesWithProtectionWarnings.length >= 1,
    currenciesWithProtectionWarnings,
  }
}
