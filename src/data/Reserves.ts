import { TokenAmount, Pair, Currency, Token } from 'dxswap-sdk'
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
import { useTrackedTokenPairs } from '../state/user/hooks'
import BigNumber from 'bignumber.js'
import { getPairRemainingRewardsUSD } from '../utils/liquidityMining'
import { useETHUSDPrice } from '../hooks/useETHUSDPrice'
import { useQuery } from '@apollo/client'
import {
  GET_PAIRS_BY_TOKEN0_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
  PairsWithNonExpiredLiquidityMiningCampaignsQueryResult
} from '../apollo/queries'
import { ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'

const PAIR_INTERFACE = new Interface(IDXswapPairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
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
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      }),
    [tokens]
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
        swapFees && swapFees[Pair.getAddress(token0, token1)] && swapFees[Pair.getAddress(token0, token1)].fee
          ? swapFees[Pair.getAddress(token0, token1)].fee
          : // default to 0.25% in case the "real" swap fee is not ready to be queried (https://github.com/levelkdev/dxswap-dapp/issues/150)
            BigInt(25)
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          swapFee,
          protocolFeeDenominator ? BigInt(protocolFeeDenominator) : BigInt(0)
        )
      ]
    })
  }, [protocolFeeDenominator, results, swapFees, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}

export function useExistingRawPairs(): Pair[] {
  const rawPairsList = useTrackedTokenPairs()
  const results = usePairs(rawPairsList)

  return useMemo(() => {
    return results.reduce((existingPairs: Pair[], result) => {
      if (result && result[0] === PairState.EXISTS && result[1]) {
        existingPairs.push(result[1])
      }
      return existingPairs
    }, [])
  }, [results])
}

export function usePairsByToken0WithRemainingRewardUSD(
  token0?: Token | null
): {
  loading: boolean
  wrappedPairs: { pair: Pair; remainingRewardUSD: BigNumber }[]
} {
  const { chainId } = useWeb3React()
  const { loading: loadingEthUsdPrice, ethUSDPrice } = useETHUSDPrice()
  const { error, loading: loadingPairs, data } = useQuery<PairsWithNonExpiredLiquidityMiningCampaignsQueryResult>(
    GET_PAIRS_BY_TOKEN0_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS,
    { variables: { token0Id: token0?.address.toLowerCase(), timestamp: Math.floor(Date.now() / 1000) } }
  )
  console.log(error)

  return useMemo(() => {
    if (!data || !chainId || loadingPairs || loadingEthUsdPrice) return { loading: true, wrappedPairs: [] }
    return {
      loading: false,
      wrappedPairs: data.pairs.map(pair => {
        const token0 = new Token(
          chainId,
          pair.token0.address,
          parseInt(pair.token0.decimals),
          pair.token0.symbol,
          pair.token0.name
        )
        const token1 = new Token(
          chainId,
          pair.token1.address,
          parseInt(pair.token1.decimals),
          pair.token1.symbol,
          pair.token1.name
        )
        return {
          pair: new Pair(
            new TokenAmount(token0, ethers.utils.parseUnits(pair.reserve0, token0.decimals).toString()),
            new TokenAmount(token1, ethers.utils.parseUnits(pair.reserve1, token1.decimals).toString())
          ),
          remainingRewardUSD: getPairRemainingRewardsUSD(pair.liquidityMiningCampaigns, ethUSDPrice)
        }
      })
    }
  }, [chainId, data, ethUSDPrice, loadingEthUsdPrice, loadingPairs])
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
