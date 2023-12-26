import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports
import {
  addFiatSymbolToNumber,
  formatCurrencyAmount,
  formatNumberOrString,
  formatPercent,
} from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { useCurrentLocale } from 'wallet/src/features/language/hooks'

type FormatNumberOrStringInput = {
  value: Maybe<number | string>
  type?: NumberType
  currencyCode?: string
  placeholder?: string
}
type FormatCurrencyAmountInput = {
  value: CurrencyAmount<Currency> | null | undefined
  type?: NumberType
  placeholder?: string
}
type AddFiatSymbolToNumberInput = {
  value: Maybe<number | string>
  currencyCode: string
  currencySymbol: string
}
export interface LocalizedFormatter {
  formatNumberOrString: (input: FormatNumberOrStringInput) => string
  formatCurrencyAmount: (input: FormatCurrencyAmountInput) => string
  formatPercent: (value: Maybe<number | string>) => string
  addFiatSymbolToNumber: (input: AddFiatSymbolToNumberInput) => string
}

/**
 * Hook used to return a formatter with all necessary formatting functions needed in the app.
 * This is based off of the currently selected language in the app, so it will make sure that
 * the formatted values are localized. If any new formatting needs arise, add them here.
 * @returns set of formatting functions based off of current locale
 */
export function useLocalizedFormatter(): LocalizedFormatter {
  const locale = useCurrentLocale()

  const formatNumberOrStringInner = useCallback(
    ({
      value,
      type = NumberType.TokenNonTx,
      currencyCode,
      placeholder,
    }: FormatNumberOrStringInput): string =>
      formatNumberOrString({ price: value, locale, currencyCode, type, placeholder }),
    [locale]
  )
  const formatCurrencyAmountInner = useCallback(
    ({ value, type, placeholder }: FormatCurrencyAmountInput): string =>
      formatCurrencyAmount({ amount: value, locale, type, placeholder }),
    [locale]
  )
  const formatPercentInner = useCallback(
    (value: Maybe<number | string>): string => formatPercent(value, locale),
    [locale]
  )

  const addFiatSymbolToNumberInner = useCallback(
    ({ value, currencyCode, currencySymbol }: AddFiatSymbolToNumberInput): string =>
      addFiatSymbolToNumber({ value, currencyCode, currencySymbol, locale }),
    [locale]
  )

  return useMemo(
    () => ({
      formatNumberOrString: formatNumberOrStringInner,
      formatCurrencyAmount: formatCurrencyAmountInner,
      formatPercent: formatPercentInner,
      addFiatSymbolToNumber: addFiatSymbolToNumberInner,
    }),
    [
      formatNumberOrStringInner,
      formatCurrencyAmountInner,
      formatPercentInner,
      addFiatSymbolToNumberInner,
    ]
  )
}
