import { Currency, CurrencyAmount, TradeType } from '@alagunoff/uniswap-sdk-core'
import { Pair, Trade } from '@alagunoff/uniswap-v2-sdk'
import { useMemo } from 'react'
import { isTradeBetter } from 'utils/isTradeBetter'
import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../constants/misc'
import { useAllCurrencyCombinations } from './useAllCurrencyCombinations'
import { PairState, useV2Pairs } from './useV2Pairs'
import { useActiveWeb3React } from './web3'
import { PAIR_INIT_CODE_HASHES, V2_CORE_FACTORY_ADDRESSES } from 'constants/addresses'

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
export function useV2TradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  { maxHops = MAX_HOPS } = {}
): Trade<Currency, Currency, TradeType.EXACT_INPUT> | null {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)
  const factoryAddress = chainId && V2_CORE_FACTORY_ADDRESSES[chainId]
  const pairInitCodeHash = chainId && PAIR_INIT_CODE_HASHES[chainId]

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && factoryAddress && pairInitCodeHash) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactIn(
            allowedPairs,
            currencyAmountIn,
            currencyOut,
            { maxHops: 1, maxNumResults: 1 },
            undefined,
            undefined,
            undefined,
            factoryAddress,
            pairInitCodeHash
          )[0] ?? null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_INPUT> | null = null
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | null =
          Trade.bestTradeExactIn(
            allowedPairs,
            currencyAmountIn,
            currencyOut,
            { maxHops: i, maxNumResults: 1 },
            undefined,
            undefined,
            undefined,
            factoryAddress,
            pairInitCodeHash
          )[0] ?? null
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyAmountIn, currencyOut, maxHops, factoryAddress, pairInitCodeHash])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useV2TradeExactOut(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount<Currency>,
  { maxHops = MAX_HOPS } = {}
): Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)
  const factoryAddress = chainId && V2_CORE_FACTORY_ADDRESSES[chainId]
  const pairInitCodeHash = chainId && PAIR_INIT_CODE_HASHES[chainId]

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0 && factoryAddress && pairInitCodeHash) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactOut(
            allowedPairs,
            currencyIn,
            currencyAmountOut,
            { maxHops: 1, maxNumResults: 1 },
            undefined,
            undefined,
            undefined,
            factoryAddress,
            pairInitCodeHash
          )[0] ?? null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null = null
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade =
          Trade.bestTradeExactOut(
            allowedPairs,
            currencyIn,
            currencyAmountOut,
            { maxHops: i, maxNumResults: 1 },
            undefined,
            undefined,
            undefined,
            factoryAddress,
            pairInitCodeHash
          )[0] ?? null
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, maxHops, factoryAddress, pairInitCodeHash])
}
