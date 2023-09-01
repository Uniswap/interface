import { Currency } from 'graphql/data/__generated__/types-and-hooks'
import { useLocalCurrencyConversionRate } from 'graphql/data/ConversionRate'

import { useActiveLocalCurrency } from './useActiveLocalCurrency'
import { useUSDPrice } from './useUSDPrice'

type useUSDPriceParameters = Parameters<typeof useUSDPrice>

export function useLocalCurrencyPrice(...useUSDPriceParameters: useUSDPriceParameters) {
  const activeLocalCurrency = useActiveLocalCurrency()
  const activeLocalCurrencyIsUSD = activeLocalCurrency === Currency.Usd

  const { data: usdPrice, isLoading: isUSDPriceLoading } = useUSDPrice(...useUSDPriceParameters)
  const { data: localCurrencyConversionRate, isLoading: isLocalCurrencyConversionRateLoading } =
    useLocalCurrencyConversionRate(activeLocalCurrency, activeLocalCurrencyIsUSD)

  if (activeLocalCurrencyIsUSD) {
    return { data: usdPrice, isLoading: isUSDPriceLoading }
  }

  const isLoading = isUSDPriceLoading || isLocalCurrencyConversionRateLoading
  if (!usdPrice || !localCurrencyConversionRate) {
    return { data: undefined, isLoading }
  }

  return { data: usdPrice * localCurrencyConversionRate, isLoading: false }
}
