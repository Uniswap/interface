import { Currency, CurrencyAmount, Pair, Token, Trade } from 'libs/sdk/src'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[][] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  // const basePairs: [Token, Token][] = useMemo(
  //   () =>
  //     flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
  //       ([t0, t1]) => t0.address !== t1.address
  //     ),
  //   [bases]
  // )

  const basePairs: [Token, Token][] = useMemo(() => {
    const res: [Token, Token][] = []
    for (let i = 0; i < bases.length - 1; i++) {
      for (let j = i + 1; j < bases.length; j++) {
        res.push([bases[i], bases[j]])
      }
    }
    return res
  }, [bases])

  const AAgainstAllBase = useMemo(
    () =>
      tokenA && bases.filter(base => base.address == tokenA?.address).length <= 0
        ? bases.map((base): [Token, Token] => [tokenA, base])
        : [],
    [bases, tokenA]
  )

  const BAgainstAllBase = useMemo(
    () =>
      tokenB && bases.filter(base => base.address == tokenB?.address).length <= 0
        ? bases.map((base): [Token, Token] => [tokenB, base])
        : [],
    [bases, tokenB]
  )
  const directPair = useMemo(
    () =>
      tokenA &&
      tokenB &&
      bases.filter(base => base.address == tokenA?.address).length <= 0 &&
      bases.filter(base => base.address == tokenB?.address).length <= 0
        ? [[tokenA, tokenB]]
        : [],
    [bases, tokenA, tokenB]
  )
  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            ...directPair,
            // token A against all bases
            ...AAgainstAllBase,
            // token B against all bases
            ...BAgainstAllBase,
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
  // const allPairss = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      allPairs.reduce<Pair[][]>((res, poolArray) => {
        const t = Object.values(
          poolArray
            .filter((result): result is [PairState.EXISTS, Pair] =>
              Boolean(result[0] === PairState.EXISTS && result[1])
            )
            .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
              memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
              return memo
            }, {})
        )
        res.push(t)
        return res
      }, []),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut).filter(item => item.length > 0)
  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 3, maxNumResults: 1 })[0] ?? null
      )
    }
    return null
  }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency).filter(item => item.length > 0)
  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 3, maxNumResults: 1 })[0] ??
        null
      )
    }
    return null
  }, [allowedPairs, currencyIn, currencyAmountOut])
}
