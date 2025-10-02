import { GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyCode, useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { FiatNumberType } from 'utilities/src/format/types'

type SupportedServerCurrency = Extract<
  GraphQLApi.Currency,
  | GraphQLApi.Currency.Ars
  | GraphQLApi.Currency.Aud
  | GraphQLApi.Currency.Brl
  | GraphQLApi.Currency.Cad
  | GraphQLApi.Currency.Cny
  | GraphQLApi.Currency.Cop
  | GraphQLApi.Currency.Eur
  | GraphQLApi.Currency.Gbp
  | GraphQLApi.Currency.Hkd
  | GraphQLApi.Currency.Idr
  | GraphQLApi.Currency.Inr
  | GraphQLApi.Currency.Jpy
  | GraphQLApi.Currency.Krw
  | GraphQLApi.Currency.Mxn
  | GraphQLApi.Currency.Ngn
  | GraphQLApi.Currency.Pkr
  | GraphQLApi.Currency.Rub
  | GraphQLApi.Currency.Sgd
  | GraphQLApi.Currency.Try
  | GraphQLApi.Currency.Uah
  | GraphQLApi.Currency.Usd
  | GraphQLApi.Currency.Vnd
>
const mapServerCurrencyToFiatCurrency: Record<GraphQLApi.Currency, FiatCurrency | undefined> = {
  [GraphQLApi.Currency.Ars]: FiatCurrency.ArgentinePeso,
  [GraphQLApi.Currency.Aud]: FiatCurrency.AustralianDollar,
  [GraphQLApi.Currency.Brl]: FiatCurrency.BrazilianReal,
  [GraphQLApi.Currency.Cad]: FiatCurrency.CanadianDollar,
  [GraphQLApi.Currency.Cny]: FiatCurrency.ChineseYuan,
  [GraphQLApi.Currency.Cop]: FiatCurrency.ColombianPeso,
  [GraphQLApi.Currency.Eur]: FiatCurrency.Euro,
  [GraphQLApi.Currency.Gbp]: FiatCurrency.BritishPound,
  [GraphQLApi.Currency.Hkd]: FiatCurrency.HongKongDollar,
  [GraphQLApi.Currency.Idr]: FiatCurrency.IndonesianRupiah,
  [GraphQLApi.Currency.Inr]: FiatCurrency.IndianRupee,
  [GraphQLApi.Currency.Jpy]: FiatCurrency.JapaneseYen,
  [GraphQLApi.Currency.Krw]: FiatCurrency.SouthKoreanWon,
  [GraphQLApi.Currency.Mxn]: FiatCurrency.MexicanPeso,
  [GraphQLApi.Currency.Ngn]: FiatCurrency.NigerianNaira,
  [GraphQLApi.Currency.Pkr]: FiatCurrency.PakistaniRupee,
  [GraphQLApi.Currency.Rub]: FiatCurrency.RussianRuble,
  [GraphQLApi.Currency.Sgd]: FiatCurrency.SingaporeDollar,
  [GraphQLApi.Currency.Try]: FiatCurrency.TurkishLira,
  [GraphQLApi.Currency.Uah]: FiatCurrency.UkrainianHryvnia,
  [GraphQLApi.Currency.Usd]: FiatCurrency.UnitedStatesDollar,
  [GraphQLApi.Currency.Vnd]: FiatCurrency.VietnameseDong,
  [GraphQLApi.Currency.Eth]: undefined,
  [GraphQLApi.Currency.Matic]: undefined,
  [GraphQLApi.Currency.Nzd]: undefined,
  [GraphQLApi.Currency.Thb]: undefined,
}
export const mapFiatCurrencyToServerCurrency: Record<FiatCurrency, SupportedServerCurrency> = {
  [FiatCurrency.ArgentinePeso]: GraphQLApi.Currency.Ars,
  [FiatCurrency.AustralianDollar]: GraphQLApi.Currency.Aud,
  [FiatCurrency.BrazilianReal]: GraphQLApi.Currency.Brl,
  [FiatCurrency.CanadianDollar]: GraphQLApi.Currency.Cad,
  [FiatCurrency.ChineseYuan]: GraphQLApi.Currency.Cny,
  [FiatCurrency.ColombianPeso]: GraphQLApi.Currency.Cop,
  [FiatCurrency.Euro]: GraphQLApi.Currency.Eur,
  [FiatCurrency.BritishPound]: GraphQLApi.Currency.Gbp,
  [FiatCurrency.HongKongDollar]: GraphQLApi.Currency.Hkd,
  [FiatCurrency.IndonesianRupiah]: GraphQLApi.Currency.Idr,
  [FiatCurrency.IndianRupee]: GraphQLApi.Currency.Inr,
  [FiatCurrency.JapaneseYen]: GraphQLApi.Currency.Jpy,
  [FiatCurrency.MexicanPeso]: GraphQLApi.Currency.Mxn,
  [FiatCurrency.SouthKoreanWon]: GraphQLApi.Currency.Krw,
  [FiatCurrency.NigerianNaira]: GraphQLApi.Currency.Ngn,
  [FiatCurrency.PakistaniRupee]: GraphQLApi.Currency.Pkr,
  [FiatCurrency.RussianRuble]: GraphQLApi.Currency.Rub,
  [FiatCurrency.SingaporeDollar]: GraphQLApi.Currency.Sgd,
  [FiatCurrency.TurkishLira]: GraphQLApi.Currency.Try,
  [FiatCurrency.UkrainianHryvnia]: GraphQLApi.Currency.Uah,
  [FiatCurrency.UnitedStatesDollar]: GraphQLApi.Currency.Usd,
  [FiatCurrency.VietnameseDong]: GraphQLApi.Currency.Vnd,
}

export interface FiatConverter {
  convertFiatAmount: (amount: number) => { amount: number; currency: FiatCurrency }
  convertFiatAmountFormatted: (
    fromAmount: Maybe<number | string>,
    numberType: FiatNumberType,
    placeholder?: string,
  ) => string
  conversionRate?: number
}

const SOURCE_CURRENCY = GraphQLApi.Currency.Usd // Assuming all currency data comes from USD

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
  const toCurrency = mapFiatCurrencyToServerCurrency[appCurrency]

  const { data: latestConversion, previousData: prevConversion } = GraphQLApi.useConvertQuery({
    variables: {
      fromCurrency: SOURCE_CURRENCY,
      toCurrency,
    },
    pollInterval: PollingInterval.Slow,
  })

  const conversion = latestConversion || prevConversion
  const conversionRate = conversion?.convert?.value
  const conversionCurrency = conversion?.convert?.currency
  const outputCurrency = conversionCurrency ? mapServerCurrencyToFiatCurrency[conversionCurrency] : undefined

  const convertFiatAmountInner = useCallback(
    (amount: number): { amount: number; currency: FiatCurrency } => {
      const defaultResult = { amount, currency: FiatCurrency.UnitedStatesDollar }

      if (SOURCE_CURRENCY === toCurrency || !conversionRate || !outputCurrency) {
        return defaultResult
      }

      return {
        amount: amount * conversionRate,
        currency: outputCurrency,
      }
    },
    [conversionRate, outputCurrency, toCurrency],
  )
  const convertFiatAmountFormattedInner = useCallback(
    // eslint-disable-next-line max-params
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
