import { Currency, CurrencyAmount, Pair, Token, Trade, JSBI, Percent } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
            .filter(([tokenA, tokenB]) => {
              if (!chainId) return true
              const customBases = CUSTOM_BASES[chainId]
              if (!customBases) return true

              const customBasesA: Token[] | undefined = customBases[tokenA.address]
              const customBasesB: Token[] | undefined = customBases[tokenB.address]

              if (!customBasesA && !customBasesB) return true

              if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
              if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

              return true
            })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )

  const allPairs = usePairs(allPairCombinations)

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

const PERCENT_DIFFERENCE_MAX_BIPS = 50 // 0.5% difference at most in positive direction
const ONE_IN_BIPS = 10000

// 0.5% max amount difference between amounts in single or multihop trades
const MAX_AMOUNT_DIFFERENCE_PERCENT = new Percent(JSBI.BigInt(PERCENT_DIFFERENCE_MAX_BIPS), JSBI.BigInt(ONE_IN_BIPS))

function findTradeWithMinimumHopsExactIn(lessHops: Trade, moreHops: Trade) {
  // multi output will always be at least as big as single output
  const outputDifference = JSBI.subtract(moreHops.outputAmount.raw, lessHops.outputAmount.raw)
  const differencePercentage = new Percent(outputDifference, moreHops.outputAmount.raw)

  // if difference is < threshold, return single hop
  if (differencePercentage.lessThan(MAX_AMOUNT_DIFFERENCE_PERCENT)) {
    return lessHops
  }

  return moreHops
}

function findTradeWithMinimumHopsExactOut(lessHops: Trade, moreHops: Trade) {
  const inputDifference = JSBI.subtract(lessHops.inputAmount.raw, moreHops.inputAmount.raw)
  const differencePercentage = new Percent(inputDifference, moreHops.inputAmount.raw)

  // if difference is < threshold return single hop
  if (differencePercentage.lessThan(MAX_AMOUNT_DIFFERENCE_PERCENT)) {
    return lessHops
  }
  return moreHops
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)
  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      const multiHop =
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 3, maxNumResults: 1 })[0] ?? null
      const singleHop =
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ?? null

      return findTradeWithMinimumHopsExactIn(singleHop, multiHop)
    }
    return null
  }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      const multiHop =
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 3, maxNumResults: 1 })[0] ??
        null
      const singleHop =
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
        null
      return findTradeWithMinimumHopsExactOut(singleHop, multiHop)
    }
    return null
  }, [allowedPairs, currencyIn, currencyAmountOut])
}
