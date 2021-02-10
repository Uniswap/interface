import { useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { Pair, Token } from 'dxswap-sdk'
import { useMemo } from 'react'
import {
  GET_PAIR_24H_VOLUME_USD,
  GET_PAIR_LIQUIDITY_USD,
  GET_PAIRS_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsNonExpiredLiquidityMiningCampaignsQueryResult,
  NonExpiredLiquidityMiningCampaign
} from '../apollo/queries'
import { useAggregatedByToken0ExistingPairs } from '../data/Reserves'
import { getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useETHUSDPrice } from './useETHUSDPrice'

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

export function useLiquidityMiningCampaignsForPairs(
  pairs?: Pair[]
): { loading: boolean; liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[][] } {
  const { loading, error, data } = useQuery<PairsNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIRS_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    {
      variables: {
        ids: pairs?.map(pair => pair.liquidityToken.address.toLowerCase()),
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  )

  return useMemo(() => {
    if (loading) return { loading: true, liquidityMiningCampaigns: [] }
    if (error) return { loading: false, liquidityMiningCampaigns: [] }
    return {
      loading: false,
      liquidityMiningCampaigns: data ? data.pairs.map(pair => pair.liquidityMiningCampaigns) : []
    }
  }, [data, loading, error])
}

export function useAggregatedByToken0ExistingPairsWithRemainingRewards(): {
  loading: boolean
  aggregatedData: { token0: Token; pairs: Pair[]; remainingRewardsUSD: BigNumber }[]
} {
  const { loading: loadingETHUSDPrice, ethUSDPrice } = useETHUSDPrice()
  const {
    loading: loadingPairs,
    aggregatedData: aggregatedByToken0ExistingPairs
  } = useAggregatedByToken0ExistingPairs()
  const { loading: loadingLiquidityMiningCampaigns, liquidityMiningCampaigns } = useLiquidityMiningCampaignsForPairs(
    aggregatedByToken0ExistingPairs?.flatMap(data => data.pairs)
  )

  return useMemo(() => {
    if (loadingPairs || loadingETHUSDPrice || loadingLiquidityMiningCampaigns)
      return { loading: true, aggregatedData: [] }

    return {
      loading: false,
      aggregatedData: aggregatedByToken0ExistingPairs.map(aggregatedData => {
        let analyzedPairs = 0
        return {
          ...aggregatedData,
          remainingRewardsUSD:
            liquidityMiningCampaigns.length > 0
              ? aggregatedByToken0ExistingPairs.reduce(
                  (rewardUSD, { pairs }) =>
                    rewardUSD.plus(
                      pairs.reduce(accumulator => {
                        return accumulator.plus(
                          getPairRemainingRewardsUSD(liquidityMiningCampaigns[analyzedPairs++], ethUSDPrice)
                        )
                      }, new BigNumber(0))
                    ),
                  new BigNumber(0)
                )
              : new BigNumber(0)
        }
      })
    }
  }, [
    aggregatedByToken0ExistingPairs,
    ethUSDPrice,
    liquidityMiningCampaigns,
    loadingETHUSDPrice,
    loadingLiquidityMiningCampaigns,
    loadingPairs
  ])
}
