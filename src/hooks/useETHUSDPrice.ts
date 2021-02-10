import { useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { GET_ETH_USD_PRICE } from '../apollo/queries'

export function useETHUSDPrice(): { loading: boolean; ethUSDPrice: BigNumber } {
  const { loading, error, data } = useQuery(GET_ETH_USD_PRICE)

  return useMemo(() => {
    if (loading || error) return { loading: false, ethUSDPrice: new BigNumber(0) }
    return { loading: false, ethUSDPrice: new BigNumber(data.bundle.ethPrice) }
  }, [data, error, loading])
}
