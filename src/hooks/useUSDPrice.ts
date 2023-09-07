import { Currency, CurrencyAmount } from '@kinetix/sdk-core'
import { useMemo } from 'react'

const COINGECKO_ADDRESS_MAP = {
  usdt: 'tether',
  kava: 'kava',
  wkava: 'kava',
}
const coingeckoPriceCache: any = {}

export const getCoingeckoPriceCache = (symbol: string) => {
  // @ts-ignore
  const coingeckoId = COINGECKO_ADDRESS_MAP[symbol.toLowerCase()]
  if (coingeckoPriceCache[coingeckoId] && coingeckoPriceCache[coingeckoId].updateTime < Date.now() - 60000) {
    return coingeckoPriceCache[coingeckoId].price
  }
}
const getTokenPriceByCoingecko = async (symbol: string) => {
  // @ts-ignore
  const coingeckoId = COINGECKO_ADDRESS_MAP[symbol.toLowerCase()]
  try {
    if (coingeckoPriceCache[coingeckoId] && coingeckoPriceCache[coingeckoId].updateTime < Date.now() - 10000) {
      return coingeckoPriceCache[coingeckoId].price
    }
  } catch (e) {
    if (coingeckoPriceCache[coingeckoId]) {
      return coingeckoPriceCache[coingeckoId].price
    }
    coingeckoPriceCache[coingeckoId] = {
      updateTime: Date.now(),
    }
    console.error('Error on getTokenPriceByCoingecko', e)
  }
  return 0
}
export function useUSDPrice(
  currencyAmount?: CurrencyAmount<Currency>,
  prefetchCurrency?: Currency
): {
  data?: number
  isLoading: boolean
} {
  let price = 0
  let isLoading = true
  if (currencyAmount && currencyAmount.currency && currencyAmount?.currency?.symbol) {
    getTokenPriceByCoingecko(currencyAmount?.currency.symbol).then((p) => {
      price = p || 0
      isLoading = false
    })
  }
  return useMemo(() => {
    return { data: price, isLoading }
  }, [price, isLoading])
}
