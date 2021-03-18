import { gql, useQuery } from '@apollo/client'
import { LiquidityMiningCampaign, Pair } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'

const QUERY = gql`
  query($pairId: ID, $timestamp: BigInt!, $lowerTimeLimit: BigInt!) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, endsAt_gte: $lowerTimeLimit, endsAt_lt: $timestamp }) {
      address: id
      duration
      startsAt
      endsAt
      locked
      rewardTokens {
        derivedNativeCurrency
        address: id
        name
        symbol
        decimals
      }
      stakedAmount
      rewardAmounts
    }
  }
`

export function useExpiredLiquidityMiningCampaignsForPair(
  pair: Pair,
  lowerTimeLimit: Date
): { loading: boolean; liquidityMiningCampaigns: LiquidityMiningCampaign[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const { data, loading: loadingExpiredCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
  }>(QUERY, {
    variables: {
      pairId: pair.liquidityToken.address.toLowerCase(),
      timestamp: Math.floor(Date.now() / 1000),
      lowerTimeLimit: Math.floor(lowerTimeLimit.getTime() / 1000)
    }
  })

  return useMemo(() => {
    if (loadingExpiredCampaigns || loadingReserveNativeCurrency) return { loading: true, liquidityMiningCampaigns: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply) return { loading: false, liquidityMiningCampaigns: [] }
    return {
      loading: false,
      liquidityMiningCampaigns: toLiquidityMiningCampaigns(
        chainId,
        pair,
        lpTokenTotalSupply?.raw.toString(),
        reserveNativeCurrency.raw.toString(),
        data.liquidityMiningCampaigns,
        nativeCurrency
      )
    }
  }, [
    chainId,
    data,
    error,
    loadingExpiredCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency.raw
  ])
}
