import { useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { GET_NATIVE_CURRENCY_USD_PRICE } from '../apollo/queries'

export function useNativeCurrencyUSDPrice(): { loading: boolean; nativeCurrencyUSDPrice: BigNumber } {
  const { loading, error, data } = useQuery(GET_NATIVE_CURRENCY_USD_PRICE)

  return useMemo(() => {
    if (loading || error) return { loading: false, nativeCurrencyUSDPrice: new BigNumber(0) }
    return { loading: false, nativeCurrencyUSDPrice: new BigNumber(data.bundle.Price) }
  }, [data, error, loading])
}
