import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useSpotPricesQuery } from 'src/features/dataApi/slice'

export function useSpotPrices(currencies: Currency[]) {
  const tickers = useMemo(() => currencies.map((c) => c.symbol ?? ''), [currencies])

  const { currentData: spotPrices, isLoading: loading } = useSpotPricesQuery({ tickers })

  return { spotPrices, loading }
}
