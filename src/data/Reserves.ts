import { TokenAmount, Pair, Currency, RoutablePlatform } from '@swapr/sdk'
import { useMemo } from 'react'
import { abi as IDXswapPairABI } from '@swapr/core/build/IDXswapPair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { useFeesState } from '../state/fees/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { usePairContract, useTokenContract } from '../hooks/useContract'
import { useToken } from '../hooks/Tokens'
import { useSingleCallResult } from '../state/multicall/hooks'
import { BigNumber } from 'ethers'

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
      const swapFee = swapFees?.[Pair.getAddress(token0, token1, platform)]?.fee
      if (!swapFee && platform === RoutablePlatform.SWAPR) return [PairState.LOADING, null]
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          swapFee || platform.defaultSwapFee,
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

export function usePairLiquidityTokenTotalSupply(pair?: Pair): TokenAmount | null {
  const lpTokenContract = useTokenContract(pair?.liquidityToken.address)
  const totalSupplyResult = useSingleCallResult(lpTokenContract, 'totalSupply')

  return useMemo(() => {
    if (!pair || !totalSupplyResult.result || totalSupplyResult.result.length === 0) return null
    const supply = totalSupplyResult.result[0] as BigNumber
    return new TokenAmount(pair.liquidityToken, supply.toString())
  }, [pair, totalSupplyResult.result])
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
