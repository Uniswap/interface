import { Token, TokenAmount, Pair } from '@uniswap/sdk'
import { useMemo } from 'react'

import { usePairContract } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

/*
 * if loading, return undefined
 * if no pair created yet, return null
 * if pair already created (even if 0 reserves), return pair
 */
export function usePair(tokenA?: Token, tokenB?: Token): undefined | Pair | null {
  const pairAddress = tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
  const contract = usePairContract(pairAddress, false)
  const reserves = useSingleCallResult(contract, 'getReserves')

  return useMemo(() => {
    if (!pairAddress || !contract || !tokenA || !tokenB) return undefined
    if (!reserves) return null
    const { reserve0, reserve1 } = reserves
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    return new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
  }, [contract, pairAddress, reserves, tokenA, tokenB])
}
