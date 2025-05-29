import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { Currency, useConvertQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyCode, useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { FiatNumberType } from 'utilities/src/format/types'

type SupportedServerCurrency = Extract<
  Currency,
  | Currency.Aud
  | Currency.Brl
  | Currency.Cad
  | Currency.Cny
  | Currency.Eur
  | Currency.Gbp
  | Currency.Hkd
  | Currency.Idr
  | Currency.Inr
  | Currency.Jpy
  | Currency.Krw
  | Currency.Ngn
  | Currency.Pkr
  | Currency.Rub
  | Currency.Sgd
  | Currency.Thb
  | Currency.Try
  | Currency.Uah
  | Currency.Usd
  | Currency.Vnd
>
const mapServerCurrencyToFiatCurrency: Record<Currency, FiatCurrency | undefined> = {
  [Currency.Aud]: FiatCurrency.AustralianDollar,
  [Currency.Brl]: FiatCurrency.BrazilianReal,
  [Currency.Cad]: FiatCurrency.CanadianDollar,
  [Currency.Cny]: FiatCurrency.ChineseYuan,
  [Currency.Eur]: FiatCurrency.Euro,
  [Currency.Gbp]: FiatCurrency.BritishPound,
  [Currency.Hkd]: FiatCurrency.HongKongDollar,
  [Currency.Idr]: FiatCurrency.IndonesianRupiah,
  [Currency.Inr]: FiatCurrency.IndianRupee,
  [Currency.Jpy]: FiatCurrency.JapaneseYen,
  [Currency.Krw]: FiatCurrency.SouthKoreanWon,
  [Currency.Ngn]: FiatCurrency.NigerianNaira,
  [Currency.Pkr]: FiatCurrency.PakistaniRupee,
  [Currency.Rub]: FiatCurrency.RussianRuble,
  [Currency.Sgd]: FiatCurrency.SingaporeDollar,
  [Currency.Thb]: FiatCurrency.ThaiBaht,
  [Currency.Try]: FiatCurrency.TurkishLira,
  [Currency.Uah]: FiatCurrency.UkrainianHryvnia,
  [Currency.Usd]: FiatCurrency.UnitedStatesDollar,
  [Currency.Vnd]: FiatCurrency.VietnameseDong,
  [Currency.Eth]: undefined,
  [Currency.Matic]: undefined,
}
export const mapFiatCurrencyToServerCurrency: Record<FiatCurrency, SupportedServerCurrency> = {
  [FiatCurrency.AustralianDollar]: Currency.Aud,
  [FiatCurrency.BrazilianReal]: Currency.Brl,
  [FiatCurrency.CanadianDollar]: Currency.Cad,
  [FiatCurrency.ChineseYuan]: Currency.Cny,
  [FiatCurrency.Euro]: Currency.Eur,
  [FiatCurrency.BritishPound]: Currency.Gbp,
  [FiatCurrency.HongKongDollar]: Currency.Hkd,
  [FiatCurrency.IndonesianRupiah]: Currency.Idr,
  [FiatCurrency.IndianRupee]: Currency.Inr,
  [FiatCurrency.JapaneseYen]: Currency.Jpy,
  [FiatCurrency.SouthKoreanWon]: Currency.Krw,
  [FiatCurrency.NigerianNaira]: Currency.Ngn,
  [FiatCurrency.PakistaniRupee]: Currency.Pkr,
  [FiatCurrency.RussianRuble]: Currency.Rub,
  [FiatCurrency.SingaporeDollar]: Currency.Sgd,
  [FiatCurrency.ThaiBaht]: Currency.Thb,
  [FiatCurrency.TurkishLira]: Currency.Try,
  [FiatCurrency.UkrainianHryvnia]: Currency.Uah,
  [FiatCurrency.UnitedStatesDollar]: Currency.Usd,
  [FiatCurrency.VietnameseDong]: Currency.Vnd,
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

const SOURCE_CURRENCY = Currency.Usd // Assuming all currency data comes from USD

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

  const { data: latestConversion, previousData: prevConversion } = useConvertQuery({
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
