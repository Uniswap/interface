import { Interface } from '@ethersproject/abi'
import ITeleswapV2PairABI from '@teleswap/contracts/build/ITeleswapV2Pair.json'
import { Currency, Pair, Token, TokenAmount } from '@teleswap/sdk'
import { useMemo } from 'react'

import { useActiveWeb3React } from '../hooks'
import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

const PAIR_INTERFACE = new Interface(ITeleswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined, boolean | undefined][]
): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()
  const tokens = useMemo(
    () =>
      currencies.map(
        ([currencyA, currencyB, stable]) =>
          [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId), stable] as [
            Token | undefined,
            Token | undefined,
            boolean | undefined
          ]
      ),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB, stable]) => {
        return tokenA && tokenB && stable !== undefined && !tokenA.equals(tokenB)
          ? Pair.getAddress(tokenA, tokenB, stable)
          : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]
      const stable = tokens[i][2]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (stable === undefined) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()), stable)
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency, stable = false): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB, stable]])[0]
}
