import { useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { Pair } from 'dxswap-sdk'
import { GET_PAIR_24H_VOLUME_USD, GET_PAIR_LIQUIDITY_USD } from '../apollo/queries'

export function usePair24hVolumeUSD(pair?: Pair | null): { loading: boolean; volume24hUSD: BigNumber } {
  const { loading, data } = useQuery(GET_PAIR_24H_VOLUME_USD, {
    variables: { id: pair?.liquidityToken.address.toLowerCase() }
  })

  return { loading, volume24hUSD: new BigNumber(data?.pair?.volumeUSD || 0) }
}

export function usePairLiquidityUSD(pair?: Pair | null): { loading: boolean; liquidityUSD: BigNumber } {
  const { loading, data } = useQuery(GET_PAIR_LIQUIDITY_USD, {
    variables: { id: pair?.liquidityToken.address.toLowerCase() }
  })

  return { loading, liquidityUSD: new BigNumber(data?.pair?.reserveUSD || 0) }
}
