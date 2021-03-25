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
  query($pairId: ID, $timestamp: BigInt!) {
    liquidityMiningCampaigns(where: { stakablePair: $pairId, startsAt_lte: $timestamp, endsAt_gt: $timestamp }) {
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

export function useActiveLiquidityMiningCampaignsForPair(
  pair: Pair
): { loading: boolean; liquidityMiningCampaigns: LiquidityMiningCampaign[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(pair)
  const { loading: loadingReserveNativeCurrency, reserveNativeCurrency } = usePairReserveNativeCurrency(pair)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const { data, loading: loadingActiveCampaigns, error } = useQuery<{
    liquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[]
  }>(QUERY, {
    variables: { pairId: pair.liquidityToken.address.toLowerCase(), timestamp }
  })

  return useMemo(() => {
    if (loadingActiveCampaigns || loadingReserveNativeCurrency) return { loading: true, liquidityMiningCampaigns: [] }
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
    loadingActiveCampaigns,
    loadingReserveNativeCurrency,
    lpTokenTotalSupply,
    nativeCurrency,
    pair,
    reserveNativeCurrency
  ])
}
