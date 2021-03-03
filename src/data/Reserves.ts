import { TokenAmount, Pair, Currency, Token, RoutablePlatform } from 'dxswap-sdk'
import { useMemo } from 'react'
import { abi as IDXswapPairABI } from 'dxswap-core/build/IDXswapPair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { useFeesState } from '../state/fees/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { usePairContract } from '../hooks/useContract'
import { useToken } from '../hooks/Tokens'
import { useSingleCallResult } from '../state/multicall/hooks'
import BigNumber from 'bignumber.js'
import { getPairMaximumApy, getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useNativeCurrencyUSDPrice } from '../hooks/useNativeCurrencyUSDPrice'
import { gql, useQuery } from '@apollo/client'
import {
  GET_PAIRS_BY_TOKEN0_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsWithNonExpiredLiquidityMiningCampaignsQueryResult,
  RawToken
} from '../apollo/queries'
import { ethers } from 'ethers'

const PAIR_INTERFACE = new Interface(IDXswapPairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined][],
  platform: RoutablePlatform = RoutablePlatform.SWAPR
): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) && chainId && platform.supportsChain(chainId)
          ? Pair.getAddress(tokenA, tokenB, platform)
          : undefined
      }),
    [tokens, chainId, platform]
  )

  const { swapFees, protocolFeeDenominator } = useFeesState()

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      const swapFee =
        swapFees &&
        swapFees[Pair.getAddress(token0, token1, platform)] &&
        swapFees[Pair.getAddress(token0, token1, platform)].fee
          ? swapFees[Pair.getAddress(token0, token1, platform)].fee
          : // default to the default platform swap fee (defined in the SDK and 0.25% for Swaps)
            // in case the "real" swap fee is not ready to be queried (https://github.com/levelkdev/dxswap-dapp/issues/150)
            platform.defaultSwapFee
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          swapFee,
          protocolFeeDenominator ? BigInt(protocolFeeDenominator) : BigInt(0),
          platform
        )
      ]
    })
  }, [protocolFeeDenominator, results, swapFees, tokens, platform])
}

export function usePair(tokenA?: Currency, tokenB?: Currency, platform?: RoutablePlatform): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]], platform)[0]
}

export function useAllPairs(): { loading: boolean; pairs: Pair[] } {
  interface RawPair {
    reserve0: string
    reserve1: string
    token0: RawToken
    token1: RawToken
  }

  interface QueryResult {
    pairs: RawPair[]
  }

  const { chainId } = useActiveWeb3React()
  const { loading, data, error } = useQuery<QueryResult>(gql`
    query getAllPairs {
      pairs {
        reserve0
        reserve1
        token0 {
          address: id
          name
          symbol
          decimals
        }
        token1 {
          address: id
          name
          symbol
          decimals
        }
      }
    }
  `)

  return useMemo(() => {
    if (loading || !chainId) return { loading: true, pairs: [] }
    if (!data || error) return { loading: false, pairs: [] }
    return {
      loading: false,
      pairs: data.pairs.reduce((pairs: Pair[], rawPair) => {
        const { token0, token1, reserve0, reserve1 } = rawPair
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
        pairs.push(new Pair(tokenAmountA, tokenAmountB))
        return pairs
      }, [])
    }
  }, [chainId, data, error, loading])
}

export function usePairReserveNativeCurrency(pair?: Pair): { loading: boolean; reserveNativeCurrency: BigNumber } {
  interface QueryResult {
    pair: { reserveNativeCurrency: string }
  }

  const { loading, data, error } = useQuery<QueryResult>(
    gql`
      query getPairReserveNativeCurrency($pairId: ID!) {
        pair(id: $pairId) {
          reserveNativeCurrency
        }
      }
    `,
    { variables: { pairId: pair?.liquidityToken.address.toLowerCase() } }
  )

  return useMemo(() => {
    if (loading) return { loading: true, reserveNativeCurrency: new BigNumber(0) }
    if (!data || error) return { loading: false, reserveNativeCurrency: new BigNumber(0) }
    return {
      loading: false,
      reserveNativeCurrency: new BigNumber(data.pair.reserveNativeCurrency)
    }
  }, [data, error, loading])
}

export function usePairLiquidityTokenTotalSupply(pair?: Pair): { loading: boolean; supply: BigNumber } {
  interface QueryResult {
    pair: { totalSupply: string }
  }

  const { loading, data, error } = useQuery<QueryResult>(
    gql`
      query getPairLiquidityTokenTotalSupply($pairId: ID!) {
        pair(id: $pairId) {
          totalSupply
        }
      }
    `,
    { variables: { pairId: pair?.liquidityToken.address.toLowerCase() } }
  )

  return useMemo(() => {
    if (loading) return { loading: true, supply: new BigNumber(0) }
    if (!data || error) return { loading: false, supply: new BigNumber(0) }
    return {
      loading: false,
      supply: new BigNumber(data.pair.totalSupply)
    }
  }, [data, error, loading])
}

export function usePairsByToken0WithRemainingRewardUSDAndMaximumApy(
  token0?: Token | null
): {
  loading: boolean
  wrappedPairs: { pair: Pair; remainingRewardUSD: BigNumber; maximumApy: BigNumber }[]
} {
  const { chainId } = useActiveWeb3React()
  const { loading: loadingNativeCurrencyUsdPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const { error, loading: loadingPairs, data } = useQuery<PairsWithNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIRS_BY_TOKEN0_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    { variables: { token0Id: token0?.address.toLowerCase(), timestamp: Math.floor(Date.now() / 1000) } }
  )

  return useMemo(() => {
    if (!chainId || loadingPairs || loadingNativeCurrencyUsdPrice) return { loading: true, wrappedPairs: [] }
    if (!data || error) return { loading: false, wrappedPairs: [] }
    return {
      loading: false,
      wrappedPairs: data.pairs.map(pair => {
        const token0 = new Token(
          chainId,
          ethers.utils.getAddress(pair.token0.address),
          parseInt(pair.token0.decimals),
          pair.token0.symbol,
          pair.token0.name
        )
        const token1 = new Token(
          chainId,
          ethers.utils.getAddress(pair.token1.address),
          parseInt(pair.token1.decimals),
          pair.token1.symbol,
          pair.token1.name
        )
        return {
          pair: new Pair(
            new TokenAmount(token0, ethers.utils.parseUnits(pair.reserve0, token0.decimals).toString()),
            new TokenAmount(token1, ethers.utils.parseUnits(pair.reserve1, token1.decimals).toString())
          ),
          remainingRewardUSD: getPairRemainingRewardsUSD(pair.liquidityMiningCampaigns, nativeCurrencyUSDPrice),
          maximumApy: getPairMaximumApy(
            new BigNumber(pair.reserveNativeCurrency),
            new BigNumber(pair.totalSupply),
            pair.liquidityMiningCampaigns,
            nativeCurrencyUSDPrice
          )
        }
      })
    }
  }, [chainId, data, error, nativeCurrencyUSDPrice, loadingNativeCurrencyUsdPrice, loadingPairs])
}

export function usePairAtAddress(address?: string): Pair | null {
  const pairContract = usePairContract(address)
  const { result: token0Result } = useSingleCallResult(pairContract, 'token0()')
  const { result: token1Result } = useSingleCallResult(pairContract, 'token1()')
  const token0 = useToken(token0Result && token0Result[0])
  const token1 = useToken(token1Result && token1Result[0])
  const result = usePair(token0 || undefined, token1 || undefined)
  return result[0] === PairState.EXISTS && result[1] ? result[1] : null
}
