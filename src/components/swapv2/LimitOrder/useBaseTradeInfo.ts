import { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

export type BaseTradeInfo = {
  priceUsdIn: number
  priceUsdOut: number
  marketRate: number
  invertRate: number
}

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const addresses = useMemo(() => {
    return [currencyIn?.wrapped.address, currencyOut?.wrapped.address].filter(Boolean) as string[]
  }, [currencyIn, currencyOut])

  const { data: pricesUsd, loading } = useTokenPricesWithLoading(addresses)
  const tradeInfo: BaseTradeInfo | undefined = useMemo(() => {
    if (!currencyIn || !currencyOut) return
    const priceUsdIn = pricesUsd[currencyIn?.wrapped.address]
    const priceUsdOut = pricesUsd[currencyOut?.wrapped.address]
    if (!priceUsdIn || !priceUsdOut) return

    return {
      priceUsdIn,
      priceUsdOut,
      marketRate: priceUsdIn / priceUsdOut,
      invertRate: priceUsdOut / priceUsdIn,
    }
  }, [pricesUsd, currencyIn, currencyOut])

  return { loading, tradeInfo }
}
