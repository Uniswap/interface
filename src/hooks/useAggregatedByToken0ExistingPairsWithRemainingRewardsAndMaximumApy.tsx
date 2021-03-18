import { Pair, Token, CurrencyAmount, Percent } from 'dxswap-sdk'
import { useMemo } from 'react'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useAggregatedByToken0PairComparator } from '../components/SearchModal/sorting'
import { getPairMaximumApy, getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useNativeCurrencyUSDPrice } from './useNativeCurrencyUSDPrice'
import { ZERO_USD } from '../constants'
import { useAllPairsWithNonExpiredLiquidityMiningCampaigns } from './useAllPairsWithNonExpiredLiquidityMiningCampaigns'

export function useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy(
  filter: PairsFilterType = PairsFilterType.ALL
): {
  loading: boolean
  aggregatedData: {
    token0: Token
    pairs: Pair[]
    remainingRewardsUSD: CurrencyAmount
    maximumApy: Percent
  }[]
} {
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const { loading: loadingAllPairs, pairs: allPairs } = useAllPairsWithNonExpiredLiquidityMiningCampaigns()
  const sorter = useAggregatedByToken0PairComparator()

  return useMemo(() => {
    if (loadingAllPairs || loadingNativeCurrencyUSDPrice) return { loading: true, aggregatedData: [] }
    const aggregationMap: {
      [token0Address: string]: {
        token0: Token
        pairs: Pair[]
        remainingRewardsUSD: CurrencyAmount
        maximumApy: Percent
      }
    } = {}
    for (let i = 0; i < allPairs.length; i++) {
      const pair = allPairs[i]
      const remainingRewardsUSD = getPairRemainingRewardsUSD(pair, nativeCurrencyUSDPrice)
      let mappedValue = aggregationMap[pair.token0.address]
      if (!!!mappedValue) {
        mappedValue = {
          token0: pair.token0,
          pairs: [],
          remainingRewardsUSD: ZERO_USD,
          maximumApy: ZERO_USD
        }
        aggregationMap[pair.token0.address] = mappedValue
      }
      mappedValue.pairs.push(pair)
      mappedValue.remainingRewardsUSD = mappedValue.remainingRewardsUSD.add(remainingRewardsUSD)
      const apy = getPairMaximumApy(pair)
      if (apy.greaterThan(mappedValue.maximumApy)) {
        mappedValue.maximumApy = apy
      }
    }
    let filteredData = Object.values(aggregationMap)
    if (filter !== PairsFilterType.ALL) {
      filteredData = filteredData.filter(data => {
        // TODO: fully implement filtering
        return filter === PairsFilterType.REWARDS ? data.remainingRewardsUSD.greaterThan('0') : true
      })
    }
    return {
      loading: false,
      aggregatedData: filteredData.sort(sorter)
    }
  }, [allPairs, nativeCurrencyUSDPrice, filter, loadingAllPairs, loadingNativeCurrencyUSDPrice, sorter])
}
