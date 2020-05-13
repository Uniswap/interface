import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount, Pair } from '@uniswap/sdk'
import useSWR from 'swr'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'

import { useContract } from '../hooks'
import { SWRKeys } from '.'

function getReserves(contract: Contract, token0: Token, token1: Token): () => Promise<Pair | null> {
  return async (): Promise<Pair | null> =>
    contract
      .getReserves()
      .then(
        ({ reserve0, reserve1 }: { reserve0: { toString: () => string }; reserve1: { toString: () => string } }) => {
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
  const bothDefined = !!tokenA && !!tokenB
  const invalid = bothDefined && tokenA.equals(tokenB)
  const [token0, token1] =
    bothDefined && !invalid ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : []
  const pairAddress = !!token0 && !!token1 ? Pair.getAddress(token0, token1) : undefined
  const contract = useContract(pairAddress, IUniswapV2PairABI, false)
  const shouldFetch = !!contract
  const { data } = useSWR(
    shouldFetch ? [SWRKeys.Reserves, token0.chainId, pairAddress] : null,
    getReserves(contract, token0, token1),
    {
      dedupingInterval: 10 * 1000,
      refreshInterval: 20 * 1000
    }
  )

  return data
}
