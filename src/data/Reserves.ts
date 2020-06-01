import { Token, TokenAmount, Pair } from '@uniswap/sdk'
import { useMemo } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'

import { usePairContract } from '../hooks/useContract'
import { useSingleCallResult, useMultipleContractSingleData } from '../state/multicall/hooks'

/*
 * if loading, return undefined
 * if no pair created yet, return null
 * if pair already created (even if 0 reserves), return pair
 */
export function usePair(tokenA?: Token, tokenB?: Token): undefined | Pair | null {
  const pairAddress = tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
  const contract = usePairContract(pairAddress, false)
  const { result: reserves, loading } = useSingleCallResult(contract, 'getReserves')

  return useMemo(() => {
    if (loading || !tokenA || !tokenB) return undefined
    if (!reserves) return null
    const { reserve0, reserve1 } = reserves
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    return new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
  }, [loading, reserves, tokenA, tokenB])
}

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
export function usePairs(tokens: [Token | undefined, Token | undefined][]): (undefined | Pair | null)[] {
  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading || !tokenA || !tokenB) return undefined
      if (!reserves) return null
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
    })
  }, [results, tokens])
}
