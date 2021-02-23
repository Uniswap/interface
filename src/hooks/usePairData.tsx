import { useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { Pair, Token } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import {
  GET_PAIR_24H_VOLUME_USD,
  GET_PAIR_LIQUIDITY_USD,
  GET_PAIRS_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsNonExpiredLiquidityMiningCampaignsQueryResult,
  NonExpiredLiquidityMiningCampaign,
  Pair24hVolumeQueryResult,
  PairNonExpiredLiquidityMiningCampaignsQueryResult,
  GET_PAIR_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS
} from '../apollo/queries'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useAggregatedByToken0PairComparator } from '../components/SearchModal/sorting'
import { useAggregatedByToken0ExistingPairs } from '../data/Reserves'
import { getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useETHUSDPrice } from './useETHUSDPrice'

export function usePair24hVolumeUSD(pair?: Pair | null): { loading: boolean; volume24hUSD: BigNumber } {
  const { loading, data } = useQuery<Pair24hVolumeQueryResult>(GET_PAIR_24H_VOLUME_USD, {
    variables: {
      pairAddress: pair?.liquidityToken.address.toLowerCase(),
      date: DateTime.utc()
        .startOf('day')
        .toSeconds()
    }
  })

  return { loading, volume24hUSD: new BigNumber(data?.pairDayDatas[0]?.dailyVolumeUSD || 0) }
}

export function usePairLiquidityUSD(pair?: Pair | null): { loading: boolean; liquidityUSD: BigNumber } {
  const { loading, data } = useQuery(GET_PAIR_LIQUIDITY_USD, {
    variables: { id: pair?.liquidityToken.address.toLowerCase() }
  })

  return { loading, liquidityUSD: new BigNumber(data?.pair?.reserveUSD || 0) }
}

export function useLiquidityMiningCampaignsForPair(
  pair?: Pair
): { loading: boolean; liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[] } {
  const { loading, error, data } = useQuery<PairNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIR_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    {
      variables: {
        id: pair?.liquidityToken.address.toLowerCase(),
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  )

  return useMemo(() => {
    if (loading) return { loading: true, liquidityMiningCampaigns: [] }
    if (error) return { loading: false, liquidityMiningCampaigns: [] }
    return {
      loading: false,
      liquidityMiningCampaigns: data ? data.pair.liquidityMiningCampaigns : []
    }
  }, [data, error, loading])
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
  }, [data, error, loading])
}

export function useAggregatedByToken0ExistingPairsWithRemainingRewards(
  filter: PairsFilterType = PairsFilterType.ALL
): {
  loading: boolean
  aggregatedData: {
    token0: Token
    lpTokensBalance: BigNumber
    pairs: Pair[]
    remainingRewardsUSD: BigNumber
    maximumApy: BigNumber
  }[]
} {
  const { loading: loadingETHUSDPrice, ethUSDPrice } = useETHUSDPrice()
  const {
    loading: loadingPairs,
    aggregatedData: aggregatedByToken0ExistingPairs
  } = useAggregatedByToken0ExistingPairs()
  // memoizing the pairs avoid them changing reference every time, triggering a rerender in the next instruction
  const memoizedPairs = useMemo(() => aggregatedByToken0ExistingPairs?.flatMap(data => data.pairs), [
    aggregatedByToken0ExistingPairs
  ])
  const { loading: loadingLiquidityMiningCampaigns, liquidityMiningCampaigns } = useLiquidityMiningCampaignsForPairs(
    memoizedPairs
  )
  const sorter = useAggregatedByToken0PairComparator()

  return useMemo(() => {
    if (loadingPairs || loadingETHUSDPrice || loadingLiquidityMiningCampaigns)
      return { loading: true, aggregatedData: [] }
    const unsortedUnorderedData = aggregatedByToken0ExistingPairs.map((aggregatedData, index) => {
      const remainingRewardsUSD = getPairRemainingRewardsUSD(liquidityMiningCampaigns[index], ethUSDPrice)
      return {
        ...aggregatedData,
        remainingRewardsUSD: remainingRewardsUSD,
        // TODO: calculate apy
        maximumApy: new BigNumber(0)
      }
    })
    let filteredData = unsortedUnorderedData
    if (filter !== PairsFilterType.ALL) {
      filteredData = unsortedUnorderedData.filter(data => {
        // TODO: fully implement filtering
        return filter === PairsFilterType.REWARDS ? data.remainingRewardsUSD.isGreaterThan(0) : true
      })
    }
    return {
      loading: false,
      aggregatedData: filteredData.sort(sorter)
    }
  }, [
    aggregatedByToken0ExistingPairs,
    ethUSDPrice,
    filter,
    liquidityMiningCampaigns,
    loadingETHUSDPrice,
    loadingLiquidityMiningCampaigns,
    loadingPairs,
    sorter
  ])
}
