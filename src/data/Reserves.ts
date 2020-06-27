import { Token, TokenAmount, Pair, FACTORY_ADDRESS } from 'dxswap-sdk'
import { useMemo } from 'react'
import { abi as IDXswapPairABI } from 'dxswap-core/build/contracts/IDXswapPair.json'
import { Interface } from '@ethersproject/abi'

import { useMultipleContractSingleData } from '../state/multicall/hooks'

const PAIR_INTERFACE = new Interface(IDXswapPairABI)

/*
 * if loading, return undefined
 * if no pair created yet, return null
 * if pair already created (even if 0 reserves), return pair
 */
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

export function usePair(tokenA?: Token, tokenB?: Token): undefined | Pair | null {
  return usePairs([[tokenA, tokenB]])[0]
}
