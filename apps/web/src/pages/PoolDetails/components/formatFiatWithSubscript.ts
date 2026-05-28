import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'

const DEFAULT_SUBSCRIPT_THRESHOLD = 0.01

type LocalizationContextState = ReturnType<typeof useLocalizationContext>

/**
 * Format a USD value through `convertFiatAmountFormatted` for normal magnitudes,
 * falling back to Unicode-subscript notation (e.g. "$0.0₄123") for values below
 * `subscriptThreshold`. Converts the USD value into the user's local fiat first,
 * then re-applies the locale's currency symbol via `addFiatSymbolToNumber`.
 *
 * The fiat counterpart to `formatPriceWithSubscript`. Lives alongside it because
 * both helpers are scoped to the pool detail page.
 */
export function formatFiatWithSubscript({
  usdValue,
  locale,
  fiatCurrencyInfo,
  convertFiatAmount,
  convertFiatAmountFormatted,
  addFiatSymbolToNumber,
  fiatNumberType = NumberType.FiatTokenStats,
  subscriptThreshold = DEFAULT_SUBSCRIPT_THRESHOLD,
  maxSigDigits,
  minSigDigits,
}: {
  usdValue: number
  locale: string
  fiatCurrencyInfo: Pick<FiatCurrencyInfo, 'code' | 'symbol'>
  convertFiatAmount: LocalizationContextState['convertFiatAmount']
  convertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted']
  addFiatSymbolToNumber: LocalizationContextState['addFiatSymbolToNumber']
  fiatNumberType?: FiatNumberType
  subscriptThreshold?: number
  maxSigDigits?: number
  minSigDigits?: number
}): string {
  if (usdValue === 0 || Math.abs(usdValue) >= subscriptThreshold) {
    return convertFiatAmountFormatted(usdValue, fiatNumberType)
  }
  const { amount } = convertFiatAmount(usdValue)
  if (!amount) {
    return convertFiatAmountFormatted(usdValue, fiatNumberType)
  }
  return addFiatSymbolToNumber({
    value: formatNumberWithSubscript({
      value: amount,
      locale,
      maxSigDigits,
      minSigDigits,
    }),
    currencyCode: fiatCurrencyInfo.code,
    currencySymbol: fiatCurrencyInfo.symbol,
  })
}
