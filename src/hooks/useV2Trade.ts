import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair, Trade } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { useUserSingleHopOnly } from 'state/user/hooks'
import { isTradeBetter } from 'utils/isTradeBetter'
import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../constants'
import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'
import { PairState, useV2Pairs } from './useV2Pairs'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyA, currencyB)

  const allPairs = useV2Pairs(allCurrencyCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

const MAX_HOPS = 3

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useV2TradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade: Trade | null =
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyAmountIn, currencyOut, singleHopOnly])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useV2TradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade =
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, singleHopOnly])
}
