import { Interface } from '@ethersproject/abi'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import IUniswapV2PairJson from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Pair } from '@uniswap/v2-sdk'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

const { abi: IUniswapV2PairABI } = IUniswapV2PairJson
const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(
  tokens: readonly (readonly [Token | undefined, Token | undefined])[]
): readonly (readonly [PairState, Pair | null])[] {
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

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString())
        ),
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Token, tokenB?: Token): readonly [PairState, Pair | null] {
  // if we dont memoize the array then every time this function is ran the tokens variable passed used to create pairAddresses in usePairs is new and therefor no memoization happens :(
  const tokens: readonly [Token | undefined, Token | undefined][] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  return usePairs(tokens)[0]
}
