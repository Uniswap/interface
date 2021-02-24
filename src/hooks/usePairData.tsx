import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import {
  GET_PAIR_24H_VOLUME_USD,
  GET_PAIR_LIQUIDITY_USD,
  GET_PAIRS_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  NonExpiredLiquidityMiningCampaign,
  Pair24hVolumeQueryResult,
  GET_PAIR_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsWithNonExpiredLiquidityMiningCampaignsQueryResult,
  PairWithNonExpiredLiquidityMiningCampaignsQueryResult
} from '../apollo/queries'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useAggregatedByToken0PairComparator } from '../components/SearchModal/sorting'
import { toDXSwapLiquidityToken, useTrackedTokenPairs } from '../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../state/wallet/hooks'
import { getPairMaximumApy, getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useETHUSDPrice } from './useETHUSDPrice'
import ethers from 'ethers'

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
  const { loading, error, data } = useQuery<PairWithNonExpiredLiquidityMiningCampaignsQueryResult>(
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

export function useAllPairsWithNonExpiredLiquidityMiningCampaigns(): {
  loading: boolean
  wrappedPairs: {
    pair: Pair
    liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[]
    reserveETH: BigNumber
    totalSupply: BigNumber
  }[]
} {
  const { chainId } = useWeb3React()
  const { loading, error, data } = useQuery<PairsWithNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIRS_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    {
      variables: { timestamp: Math.floor(Date.now() / 1000) }
    }
  )

  return useMemo(() => {
    if (loading) return { loading: true, wrappedPairs: [] }
    if (error || !data || !chainId) return { loading: false, wrappedPairs: [] }
    return {
      loading: false,
      wrappedPairs: data.pairs.reduce(
        (
          accumulator: {
            pair: Pair
            liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[]
            reserveETH: BigNumber
            totalSupply: BigNumber
          }[],
          pair
        ) => {
          const tokenAmountA = new TokenAmount(
            new Token(
              chainId,
              ethers.utils.getAddress(pair.token0.address),
              parseInt(pair.token0.decimals),
              pair.token0.symbol,
              pair.token0.name
            ),
            ethers.utils.parseUnits(pair.reserve0, pair.token0.decimals).toString()
          )
          const tokenAmountB = new TokenAmount(
            new Token(
              chainId,
              ethers.utils.getAddress(pair.token1.address),
              parseInt(pair.token1.decimals),
              pair.token1.symbol,
              pair.token1.name
            ),
            ethers.utils.parseUnits(pair.reserve1, pair.token1.decimals).toString()
          )
          accumulator.push({
            pair: new Pair(tokenAmountA, tokenAmountB),
            liquidityMiningCampaigns: pair.liquidityMiningCampaigns,
            reserveETH: new BigNumber(pair.reserveETH),
            totalSupply: new BigNumber(pair.totalSupply)
          })
          return accumulator
        },
        []
      )
    }
  }, [chainId, data, error, loading])
}

export function useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy(
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
  const {
    loading: loadingAllPairs,
    wrappedPairs: allWrappedPairs
  } = useAllPairsWithNonExpiredLiquidityMiningCampaigns()
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
  const sorter = useAggregatedByToken0PairComparator()

  return useMemo(() => {
    if (loadingAllPairs || loadingETHUSDPrice || loadingTrackedLpTokenBalances)
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
    for (let i = 0; i < allWrappedPairs.length; i++) {
      const { pair, liquidityMiningCampaigns, reserveETH, totalSupply } = allWrappedPairs[i]
      const liquidityTokenAddress = pair.liquidityToken.address
      const remainingRewardsUSD = getPairRemainingRewardsUSD(liquidityMiningCampaigns, ethUSDPrice)
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
      const apy = getPairMaximumApy(reserveETH, totalSupply, liquidityMiningCampaigns, ethUSDPrice)
      if (apy.isGreaterThan(mappedValue.maximumApy)) {
        mappedValue.maximumApy = apy
      }
      const lpTokenBalance = trackedLpTokenBalances[liquidityTokenAddress]
      // TODO: remove second part of the check and investigate why sometimes the tokens are different, causing an error
      if (!!lpTokenBalance && lpTokenBalance.token.equals(mappedValue.lpTokensBalance.token)) {
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
    allWrappedPairs,
    ethUSDPrice,
    filter,
    loadingAllPairs,
    loadingETHUSDPrice,
    loadingTrackedLpTokenBalances,
    sorter,
    trackedLpTokenBalances
  ])
}
