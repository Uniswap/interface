import { useQuery } from '@apollo/client'
import { Pair, Token, TokenAmount, CurrencyAmount, USD, Percent } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import {
  GET_PAIR_24H_VOLUME_USD,
  GET_PAIR_LIQUIDITY_USD,
  GET_PAIRS_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  Pair24hVolumeQueryResult,
  GET_PAIR_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsWithNonExpiredLiquidityMiningCampaignsQueryResult,
  PairWithNonExpiredLiquidityMiningCampaignsQueryResult
} from '../apollo/queries'
import { PairsFilterType } from '../components/Pool/ListFilter'
import { useAggregatedByToken0PairComparator } from '../components/SearchModal/sorting'
import { toDXSwapLiquidityToken, useTrackedTokenPairs } from '../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../state/wallet/hooks'
import { getPairMaximumApy, getPairRemainingRewardsUSD, toLiquidityMiningCampaigns } from '../utils/liquidityMining'
import { useNativeCurrencyUSDPrice } from './useNativeCurrencyUSDPrice'
import { ethers } from 'ethers'
import { useActiveWeb3React } from '.'
import { useNativeCurrency } from './useNativeCurrency'

export function usePair24hVolumeUSD(pair?: Pair | null): { loading: boolean; volume24hUSD: CurrencyAmount } {
  const { loading, data, error } = useQuery<Pair24hVolumeQueryResult>(GET_PAIR_24H_VOLUME_USD, {
    variables: {
      pairAddress: pair?.liquidityToken.address.toLowerCase(),
      date: DateTime.utc()
        .startOf('day')
        .toSeconds()
    }
  })

  return useMemo(() => {
    if (loading) return { loading: true, volume24hUSD: new CurrencyAmount(USD, '0') }
    if (!data || !data.pairDayDatas || data.pairDayDatas.length === 0 || data.pairDayDatas[0] || error)
      return { loading: false, volume24hUSD: new CurrencyAmount(USD, '0') }
    return { loading, volume24hUSD: new CurrencyAmount(USD, data.pairDayDatas[0].dailyVolumeUSD) }
  }, [data, error, loading])
}

export function usePairLiquidityUSD(pair?: Pair | null): { loading: boolean; liquidityUSD: CurrencyAmount } {
  const { loading, data, error } = useQuery(GET_PAIR_LIQUIDITY_USD, {
    variables: { id: pair?.liquidityToken.address.toLowerCase() }
  })

  return useMemo(() => {
    if (loading) return { loading: true, liquidityUSD: new CurrencyAmount(USD, '0') }
    if (!data || !data.pair || data.pair.reserveUSD || error)
      return { loading, liquidityUSD: new CurrencyAmount(USD, '0') }
    return { loading, liquidityUSD: new CurrencyAmount(USD, data.pair.reserveUSD) }
  }, [data, error, loading])
}

export function usePairWithLiquidityMiningCampaigns(pair?: Pair): { loading: boolean; pair: Pair | undefined } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
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
    if (loading) return { loading: true, pair }
    if (!data || error || !chainId || !pair) return { loading: false, pair }
    // data used to calculate the price of the LP token
    const campaigns = toLiquidityMiningCampaigns(
      chainId,
      pair,
      data.pair.totalSupply,
      data.pair.reserveNativeCurrency,
      data.pair.liquidityMiningCampaigns,
      nativeCurrency
    )
    // updating reference pair and attaching the found liquidity mining campaigns
    pair.liquidityMiningCampaigns = campaigns
    return {
      loading: false,
      pair: pair
    }
  }, [chainId, data, error, loading, nativeCurrency, pair])
}

export function useAllPairsWithNonExpiredLiquidityMiningCampaigns(): {
  loading: boolean
  pairs: Pair[]
} {
  const memoizedTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const nativeCurrency = useNativeCurrency()
  const { chainId } = useActiveWeb3React()
  const { loading, error, data } = useQuery<PairsWithNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIRS_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    { variables: { timestamp: memoizedTimestamp } }
  )

  return useMemo(() => {
    if (loading) return { loading: true, pairs: [] }
    if (error || !data || !chainId) return { loading: false, pairs: [] }
    return {
      loading: false,
      pairs: data.pairs.map(rawPair => {
        const {
          reserveNativeCurrency,
          totalSupply,
          token0,
          token1,
          reserve0,
          reserve1,
          liquidityMiningCampaigns
        } = rawPair
        const tokenAmountA = new TokenAmount(
          new Token(
            chainId,
            ethers.utils.getAddress(token0.address),
            parseInt(token0.decimals),
            token0.symbol,
            token0.name
          ),
          ethers.utils.parseUnits(reserve0, token0.decimals).toString()
        )
        const tokenAmountB = new TokenAmount(
          new Token(
            chainId,
            ethers.utils.getAddress(token1.address),
            parseInt(token1.decimals),
            token1.symbol,
            token1.name
          ),
          ethers.utils.parseUnits(reserve1, token1.decimals).toString()
        )
        const pair = new Pair(tokenAmountA, tokenAmountB)

        const campaigns = toLiquidityMiningCampaigns(
          chainId,
          pair,
          totalSupply,
          reserveNativeCurrency,
          liquidityMiningCampaigns,
          nativeCurrency
        )
        pair.liquidityMiningCampaigns = campaigns
        return pair
      }, [])
    }
  }, [chainId, data, error, loading, nativeCurrency])
}

export function useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy(
  filter: PairsFilterType = PairsFilterType.ALL
): {
  loading: boolean
  aggregatedData: {
    token0: Token
    lpTokensBalance: TokenAmount
    pairs: Pair[]
    remainingRewardsUSD: CurrencyAmount
    maximumApy: Percent
  }[]
} {
  const { account } = useActiveWeb3React()
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const { loading: loadingAllPairs, pairs: allPairs } = useAllPairsWithNonExpiredLiquidityMiningCampaigns()
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
    if (loadingAllPairs || loadingNativeCurrencyUSDPrice || loadingTrackedLpTokenBalances)
      return { loading: true, aggregatedData: [] }

    const aggregationMap: {
      [token0Address: string]: {
        token0: Token
        lpTokensBalance: TokenAmount
        pairs: Pair[]
        remainingRewardsUSD: CurrencyAmount
        maximumApy: Percent
      }
    } = {}
    for (let i = 0; i < allPairs.length; i++) {
      const pair = allPairs[i]
      const liquidityTokenAddress = pair.liquidityToken.address
      const remainingRewardsUSD = getPairRemainingRewardsUSD(pair, nativeCurrencyUSDPrice)
      let mappedValue = aggregationMap[pair.token0.address]
      if (!!!mappedValue) {
        mappedValue = {
          token0: pair.token0,
          lpTokensBalance: new TokenAmount(pair.liquidityToken, '0'),
          pairs: [],
          remainingRewardsUSD: new CurrencyAmount(USD, '0'),
          maximumApy: new CurrencyAmount(USD, '0')
        }
        aggregationMap[pair.token0.address] = mappedValue
      }
      mappedValue.pairs.push(pair)
      mappedValue.remainingRewardsUSD = mappedValue.remainingRewardsUSD.add(remainingRewardsUSD)
      const apy = getPairMaximumApy(pair)
      if (apy.greaterThan(mappedValue.maximumApy)) {
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
        return filter === PairsFilterType.REWARDS ? data.remainingRewardsUSD.greaterThan('0') : true
      })
    }
    return {
      loading: false,
      aggregatedData: filteredData.sort(sorter)
    }
  }, [
    allPairs,
    nativeCurrencyUSDPrice,
    filter,
    loadingAllPairs,
    loadingNativeCurrencyUSDPrice,
    loadingTrackedLpTokenBalances,
    sorter,
    trackedLpTokenBalances
  ])
}
