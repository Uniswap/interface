import { Currency, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { useMemo } from 'react'

import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'
import { PoolState, usePools } from './usePools'

/**
 * Returns all the existing pools that should be considered for swapping between an input currency and an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export function useV3SwapPools(
  currencyIn?: Currency,
  currencyOut?: Currency
): {
  pools: Pool[]
  loading: boolean
} {
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut)

  const allCurrencyCombinationsWithAllFees: [Token, Token, FeeAmount][] = useMemo(
    () =>
      allCurrencyCombinations.reduce<[Token, Token, FeeAmount][]>((list, [tokenA, tokenB]) => {
        return list.concat([
          [tokenA, tokenB, FeeAmount.LOW],
          [tokenA, tokenB, FeeAmount.MEDIUM],
          [tokenA, tokenB, FeeAmount.HIGH],
        ])
      }, []),
    [allCurrencyCombinations]
  )

  const pools = usePools(allCurrencyCombinationsWithAllFees)

  return useMemo(() => {
    return {
      pools: pools
        .filter((tuple): tuple is [PoolState.EXISTS, Pool] => {
          return tuple[0] === PoolState.EXISTS && tuple[1] !== null
        })
        .map(([, pool]) => pool),
      loading: pools.some(([state]) => state === PoolState.LOADING),
    }
  }, [pools])
}
