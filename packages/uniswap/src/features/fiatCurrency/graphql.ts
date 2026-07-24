import { GraphQLApi } from '@universe/api'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { FiatCurrency, SOURCE_CURRENCY } from 'uniswap/src/features/fiatCurrency/constants'

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
  | GraphQLApi.Currency.Nzd
  | GraphQLApi.Currency.Pkr
  | GraphQLApi.Currency.Rub
  | GraphQLApi.Currency.Sgd
  | GraphQLApi.Currency.Try
  | GraphQLApi.Currency.Uah
  | GraphQLApi.Currency.Usd
  | GraphQLApi.Currency.Vnd
>

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
  [FiatCurrency.NewZealandDollar]: GraphQLApi.Currency.Nzd,
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

/**
 * Hook used to return a converter with a set of all necessary conversion logic needed for
 * fiat currency. This is based off of the currently selected language and fiat currency
 * in settings, using a graphql endpoint to retrieve the conversion rate.
 * This ensures that the converted and formatted values are properly localized. If any additional
 * conversion logic is needed, please add them here.
 * @returns set of localized fiat currency conversion functions
 */
export function useConversionRateGraphQL(currency: FiatCurrency, skip: boolean): number | undefined {
  const toCurrency = mapFiatCurrencyToServerCurrency[currency]

  const { data: latestConversion, previousData: prevConversion } = GraphQLApi.useConvertQuery({
    variables: {
      fromCurrency: mapFiatCurrencyToServerCurrency[SOURCE_CURRENCY],
      toCurrency,
    },
    pollInterval: PollingInterval.Slow,
    skip,
  })

  const conversion = latestConversion || prevConversion

  return conversion?.convert?.value
}
