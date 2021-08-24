import { Pair, CurrencyAmount, Percent, Token } from '@swapr/sdk'
import { useMemo } from 'react'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useAggregatedByToken0PairComparator } from '../components/SearchModal/sorting'
import { getPairMaximumApy } from '../utils/liquidityMining'
import { useAllPairsWithNonExpiredLiquidityMiningCampaignsAndLiquidityAndStakingIndicator } from './useAllPairsWithNonExpiredLiquidityMiningCampaignsAndLiquidityAndStakingIndicator'

export function useAllPairsWithLiquidityAndMaximumApyAndStakingIndicator(
  filter: PairsFilterType = PairsFilterType.ALL,
  filterToken?: Token
): {
  loading: boolean
  aggregatedData: {
    pair: Pair
    liquidityUSD: CurrencyAmount
    maximumApy: Percent
    staked: boolean
  }[]
} {
  const {
    loading: loadingAllWrappedPairs,
    wrappedPairs: allWrappedPairs
  } = useAllPairsWithNonExpiredLiquidityMiningCampaignsAndLiquidityAndStakingIndicator(filterToken)
  const sorter = useAggregatedByToken0PairComparator()

  return useMemo(() => {
    if (loadingAllWrappedPairs) return { loading: true, aggregatedData: [] }

    const aggregation = []
    for (let i = 0; i < allWrappedPairs.length; i++) {
      const wrappedPair = allWrappedPairs[i]
      aggregation.push({
        pair: wrappedPair.pair,
        staked: wrappedPair.staked,
        liquidityUSD: wrappedPair.reserveUSD,
        maximumApy: getPairMaximumApy(wrappedPair.pair)
      })
    }
    let filteredData = aggregation
    if (filter !== PairsFilterType.ALL) {
      filteredData = filteredData.filter(data => {
        // TODO: fully implement filtering
        return filter === PairsFilterType.REWARDS ? data.maximumApy.greaterThan('0') : true
      })
    }
    return {
      loading: false,
      aggregatedData: filteredData.sort(sorter)
    }
  }, [allWrappedPairs, filter, loadingAllWrappedPairs, sorter])
}
