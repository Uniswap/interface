import { useLocalCurrencyConversionRate } from 'graphql/data/ConversionRate'

import { useActiveLocalCurrency } from './useActiveLocalCurrency'
import { useUSDPrice } from './useUSDPrice'

type useUSDPriceParameters = Parameters<typeof useUSDPrice>

export function useLocalCurrencyPrice(...useUSDPriceParameters: useUSDPriceParameters) {
  const activeLocalCurrency = useActiveLocalCurrency()

  const { data: usdPrice, isLoading: isUSDPriceLoading } = useUSDPrice(...useUSDPriceParameters)
  const { data: localCurrencyConversionRate, isLoading: isLocalCurrencyConversionRateLoading } =
    useLocalCurrencyConversionRate(activeLocalCurrency)

  const isLoading = isUSDPriceLoading || isLocalCurrencyConversionRateLoading

  if (!usdPrice || !localCurrencyConversionRate) {
    return { data: undefined, isLoading }
  }

  return { data: usdPrice * localCurrencyConversionRate, isLoading: false }
}
