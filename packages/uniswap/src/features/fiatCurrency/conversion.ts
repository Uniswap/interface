import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useConversionRate as useConversionRateRest } from 'uniswap/src/data/apiClients/dataApiService/convert/useConversionRate'
import { FiatCurrency, SOURCE_CURRENCY } from 'uniswap/src/features/fiatCurrency/constants'
import { useConversionRateGraphQL } from 'uniswap/src/features/fiatCurrency/graphql'
import { getFiatCurrencyCode, useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { FiatNumberType } from 'utilities/src/format/types'

export interface FiatConverter {
  convertFiatAmount: (amount: number) => { amount: number; currency: FiatCurrency }
  // oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
  convertFiatAmountFormatted: (
    fromAmount: Maybe<number | string>,
    numberType: FiatNumberType,
    placeholder?: string,
  ) => string
  conversionRate?: number
}

/**
 * Hook used to return a converter with a set of all necessary conversion logic needed for
 * fiat currency. This is based off of the currently selected language and fiat currency
 * in settings, using a graphql endpoint to retrieve the conversion rate.
 * This ensures that the converted and formatted values are properly localized. If any additional
 * conversion logic is needed, please add them here.
 * @returns set of localized fiat currency conversion functions
 */
export function useFiatConverter({
  formatNumberOrString,
}: Pick<LocalizationContextState, 'formatNumberOrString'>): FiatConverter {
  const appCurrency = useAppFiatCurrency()

  const currentConversionV2Enabled = useFeatureFlag(FeatureFlags.V2EndpointsCurrencyConversion)

  const conversionRateRest = useConversionRateRest(appCurrency, !currentConversionV2Enabled)
  const conversionRateGraphQL = useConversionRateGraphQL(appCurrency, currentConversionV2Enabled)

  const conversionRate = currentConversionV2Enabled ? conversionRateRest : conversionRateGraphQL

  const convertFiatAmountInner = useCallback(
    (amount: number): { amount: number; currency: FiatCurrency } => {
      const defaultResult = { amount, currency: FiatCurrency.UnitedStatesDollar }

      if (SOURCE_CURRENCY === appCurrency || !conversionRate) {
        return defaultResult
      }

      return {
        amount: amount * conversionRate,
        currency: appCurrency,
      }
    },
    [appCurrency, conversionRate],
  )
  const convertFiatAmountFormattedInner = useCallback(
    // oxlint-disable-next-line max-params
    (fromAmount: Maybe<number | string>, numberType: FiatNumberType, placeholder = '-'): string => {
      if (fromAmount === undefined || fromAmount === null) {
        return placeholder
      }

      const amountNumber = typeof fromAmount === 'string' ? parseFloat(fromAmount) : fromAmount
      const converted = convertFiatAmountInner(amountNumber)
      const currencyCode = getFiatCurrencyCode(converted.currency)

      return formatNumberOrString({
        value: converted.amount,
        type: numberType,
        currencyCode,
        placeholder,
      })
    },
    [convertFiatAmountInner, formatNumberOrString],
  )

  return useMemo(
    () => ({
      conversionRate,
      convertFiatAmount: convertFiatAmountInner,
      convertFiatAmountFormatted: convertFiatAmountFormattedInner,
    }),
    [conversionRate, convertFiatAmountFormattedInner, convertFiatAmountInner],
  )
}
