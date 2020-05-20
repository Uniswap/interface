import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount, Pair } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys, useKeepSWRDataLiveAsBlocksArrive } from '.'
import { usePairContract } from '../hooks'

function getReserves(contract: Contract, tokenA: Token, tokenB: Token): () => Promise<Pair | null> {
  return async (): Promise<Pair | null> =>
    contract
      .getReserves()
      .then(
        ({ reserve0, reserve1 }: { reserve0: { toString: () => string }; reserve1: { toString: () => string } }) => {
          const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
          return new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
        }
      )
      .catch(() => {
        return null
      })
}

/*
 * if loading, return undefined
 * if no pair created yet, return null
 * if pair already created (even if 0 reserves), return pair
 */
export function usePair(tokenA?: Token, tokenB?: Token): undefined | Pair | null {
  const pairAddress = !!tokenA && !!tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
  const contract = usePairContract(pairAddress, false)

  const shouldFetch = !!contract
  const key = shouldFetch ? [pairAddress, tokenA.chainId, SWRKeys.Reserves] : null
  const { data, mutate } = useSWR(key, getReserves(contract, tokenA, tokenB))
  useKeepSWRDataLiveAsBlocksArrive(mutate)

  return data
}
