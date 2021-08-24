import { gql, useQuery } from '@apollo/client'
import { LiquidityMiningCampaign, Pair } from '@swapr/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { toLiquidityMiningCampaign } from '../utils/liquidityMining'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'

const QUERY = gql`
  query($pairId: ID, $timestamp: BigInt!) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, startsAt_gt: $timestamp }) {
      address: id
      duration
      startsAt
      endsAt
      locked
      stakingCap
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

export function useUpcomingLiquidityMiningCampaignsForPair(
  pair?: Pair
): { loading: boolean; wrappedCampaigns: { campaign: LiquidityMiningCampaign; staked: boolean }[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const { data, loading: loadingUpcomingCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
  }>(QUERY, {
    variables: {
      pairId: pair ? pair.liquidityToken.address.toLowerCase() : '',
      timestamp
    }
  })

  return useMemo(() => {
    if (loadingUpcomingCampaigns || loadingReserveNativeCurrency) return { loading: true, wrappedCampaigns: [] }
    if (error || !data || !chainId || !lpTokenTotalSupply || !pair) return { loading: false, wrappedCampaigns: [] }
    const wrappedCampaigns = []
    for (let i = 0; i < data.liquidityMiningCampaigns.length; i++) {
      wrappedCampaigns.push({
        campaign: toLiquidityMiningCampaign(
          chainId,
          pair,
          lpTokenTotalSupply?.raw.toString(),
          reserveNativeCurrency.raw.toString(),
          data.liquidityMiningCampaigns[i],
          nativeCurrency
        ),
        staked: false
      })
    }
    return {
      loading: false,
      wrappedCampaigns
    }
  }, [
    chainId,
    data,
    error,
    loadingUpcomingCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency.raw
  ])
}
