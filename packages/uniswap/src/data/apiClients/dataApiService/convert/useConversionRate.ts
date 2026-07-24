import { useQuery } from '@tanstack/react-query'
import { FiatCurrency as DataApiFiatCurrency } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { getConvertFiatQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/convert/queries'
import { FiatCurrency, SOURCE_CURRENCY } from 'uniswap/src/features/fiatCurrency/constants'

const mapFiatCurrencyToDataApiCurrency: Record<FiatCurrency, DataApiFiatCurrency> = {
  [FiatCurrency.ArgentinePeso]: DataApiFiatCurrency.ARS,
  [FiatCurrency.AustralianDollar]: DataApiFiatCurrency.AUD,
  [FiatCurrency.BrazilianReal]: DataApiFiatCurrency.BRL,
  [FiatCurrency.CanadianDollar]: DataApiFiatCurrency.CAD,
  [FiatCurrency.ChineseYuan]: DataApiFiatCurrency.CNY,
  [FiatCurrency.ColombianPeso]: DataApiFiatCurrency.COP,
  [FiatCurrency.Euro]: DataApiFiatCurrency.EUR,
  [FiatCurrency.BritishPound]: DataApiFiatCurrency.GBP,
  [FiatCurrency.HongKongDollar]: DataApiFiatCurrency.HKD,
  [FiatCurrency.IndonesianRupiah]: DataApiFiatCurrency.IDR,
  [FiatCurrency.IndianRupee]: DataApiFiatCurrency.INR,
  [FiatCurrency.JapaneseYen]: DataApiFiatCurrency.JPY,
  [FiatCurrency.MexicanPeso]: DataApiFiatCurrency.MXN,
  [FiatCurrency.NewZealandDollar]: DataApiFiatCurrency.NZD,
  [FiatCurrency.SouthKoreanWon]: DataApiFiatCurrency.KRW,
  [FiatCurrency.NigerianNaira]: DataApiFiatCurrency.NGN,
  [FiatCurrency.PakistaniRupee]: DataApiFiatCurrency.PKR,
  [FiatCurrency.RussianRuble]: DataApiFiatCurrency.RUB,
  [FiatCurrency.SingaporeDollar]: DataApiFiatCurrency.SGD,
  [FiatCurrency.TurkishLira]: DataApiFiatCurrency.TRY,
  [FiatCurrency.UkrainianHryvnia]: DataApiFiatCurrency.UAH,
  [FiatCurrency.UnitedStatesDollar]: DataApiFiatCurrency.USD,
  [FiatCurrency.VietnameseDong]: DataApiFiatCurrency.VND,
}

/**
 * Returns the USD → target-currency conversion rate via the data-api V2 ConvertFiat RPC.
 */
export function useConversionRate(currency: FiatCurrency, skip: boolean): number | undefined {
  const toCurrency = mapFiatCurrencyToDataApiCurrency[currency]

  const { data } = useQuery(
    getConvertFiatQueryOptions({
      params: { fromAmount: { currency: mapFiatCurrencyToDataApiCurrency[SOURCE_CURRENCY], value: 1 }, toCurrency },
      enabled: !skip,
    }),
  )

  return data?.convertedAmount?.value
}
