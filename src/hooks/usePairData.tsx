import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import { ethers } from 'ethers'
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
import { useExistingRawPairs } from '../data/Reserves'
import { toDXSwapLiquidityToken, useTrackedTokenPairs } from '../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../state/wallet/hooks'
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
): {
  loading: boolean
  liquidityMiningCampaigns: { [pairAddress: string]: NonExpiredLiquidityMiningCampaign[] }
} {
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
    if (loading) return { loading: true, liquidityMiningCampaigns: {} }
    if (error || !data) return { loading: false, liquidityMiningCampaigns: {} }
    return {
      loading: false,
      liquidityMiningCampaigns: data.pairs.reduce(
        (accumulator: { [pairAddress: string]: NonExpiredLiquidityMiningCampaign[] }, pair) => {
          // the address returned from the subgraph needs checksumming to avoid problems
          // when performing the lookup
          accumulator[ethers.utils.getAddress(pair.address)] = pair.liquidityMiningCampaigns
          return accumulator
        },
        {}
      )
    }
  }, [data, error, loading])
}

export function useAggregatedByToken0ExistingPairsWithRemainingRewards(
  filter: PairsFilterType = PairsFilterType.ALL
): {
  loading: boolean
  aggregatedData: {
    token0: Token
    lpTokensBalance: TokenAmount
    pairs: Pair[]
    remainingRewardsUSD: BigNumber
    maximumApy: BigNumber
  }[]
} {
  const { account } = useWeb3React()
  const { loading: loadingETHUSDPrice, ethUSDPrice } = useETHUSDPrice()
  const allPairs = useExistingRawPairs()
  const trackedPairs = useTrackedTokenPairs()
  const trackedPairsWithLiquidityTokens = useMemo(
    () => trackedPairs.map(tokens => ({ liquidityToken: toDXSwapLiquidityToken(tokens), tokens })),
    [trackedPairs]
  )
  const lpTokens = useMemo(() => trackedPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
    trackedPairsWithLiquidityTokens
  ])
  const [trackedLpTokenBalances, loadingTrackedLpTokenBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    lpTokens
  )
  const { loading: loadingLiquidityMiningCampaigns, liquidityMiningCampaigns } = useLiquidityMiningCampaignsForPairs(
    allPairs
  )
  const sorter = useAggregatedByToken0PairComparator()

  return useMemo(() => {
    if (!allPairs || loadingETHUSDPrice || loadingLiquidityMiningCampaigns || loadingTrackedLpTokenBalances)
      return { loading: true, aggregatedData: [] }

    const aggregationMap: {
      [token0Address: string]: {
        token0: Token
        lpTokensBalance: TokenAmount
        pairs: Pair[]
        remainingRewardsUSD: BigNumber
        maximumApy: BigNumber
      }
    } = {}
    for (let i = 0; i < allPairs.length; i++) {
      const pair = allPairs[i]
      const liquidityTokenAddress = pair.liquidityToken.address
      const pairLiquidityMiningCampaigns = liquidityMiningCampaigns[liquidityTokenAddress]
      const remainingRewardsUSD = getPairRemainingRewardsUSD(pairLiquidityMiningCampaigns, ethUSDPrice)
      let mappedValue = aggregationMap[pair.token0.address]
      if (!!!mappedValue) {
        mappedValue = {
          token0: pair.token0,
          lpTokensBalance: new TokenAmount(pair.liquidityToken, '0'),
          pairs: [],
          remainingRewardsUSD: new BigNumber(0),
          maximumApy: new BigNumber(0)
        }
        aggregationMap[pair.token0.address] = mappedValue
      }
      mappedValue.pairs.push(pair)
      mappedValue.remainingRewardsUSD = mappedValue.remainingRewardsUSD.plus(remainingRewardsUSD)
      const lpTokenBalance = trackedLpTokenBalances[liquidityTokenAddress]
      if (!!lpTokenBalance) {
        mappedValue.lpTokensBalance = mappedValue.lpTokensBalance.add(lpTokenBalance)
      }
    }
    let filteredData = Object.values(aggregationMap)
    if (filter !== PairsFilterType.ALL) {
      filteredData = filteredData.filter(data => {
        // TODO: fully implement filtering
        return filter === PairsFilterType.REWARDS ? data.remainingRewardsUSD.isGreaterThan(0) : true
      })
    }
    return {
      loading: false,
      aggregatedData: filteredData.sort(sorter)
    }
  }, [
    allPairs,
    ethUSDPrice,
    filter,
    liquidityMiningCampaigns,
    loadingETHUSDPrice,
    loadingLiquidityMiningCampaigns,
    loadingTrackedLpTokenBalances,
    sorter,
    trackedLpTokenBalances
  ])
}
