import { Currency, Token } from '@uniswap/sdk-core'
import { BASES_TO_CHECK_TRADES_AGAINST } from 'constants/routing'
import { useMemo } from 'react'

import { useActiveWeb3React } from './web3'

export function useAllCurrencyCombinations(currencyA?: Currency, currencyB?: Currency): [Token, Token][] {
  const { chainId } = useActiveWeb3React()

  const [tokenA, tokenB] = chainId ? [currencyA?.wrapped, currencyB?.wrapped] : [undefined, undefined]

  const bases: Token[] = useMemo(() => {
    if (!chainId || chainId !== tokenB?.chainId) return []

    const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? []

    return [...common]
  }, [chainId, tokenB])

  return useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB] as [Token, Token],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
          ]
            // filter out invalid pairs comprised of the same asset (e.g. WETH<>WETH)
            .filter(([t0, t1]) => !t0.equals(t1))
            // filter out duplicate pairs
            .filter(([t0, t1], i, otherPairs) => {
              // find the first index in the array at which there are the same 2 tokens as the current
              const firstIndexInOtherPairs = otherPairs.findIndex(([t0Other, t1Other]) => {
                return (t0.equals(t0Other) && t1.equals(t1Other)) || (t0.equals(t1Other) && t1.equals(t0Other))
              })
              // only accept the first occurrence of the same 2 tokens
              return firstIndexInOtherPairs === i
            })
        : [],
    [tokenA, tokenB, bases]
  )
}
