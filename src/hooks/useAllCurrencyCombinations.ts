import { Currency, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { useActiveWeb3React } from './web3'

export function useAllCurrencyCombinations(currencyA?: Currency, currencyB?: Currency): [Token, Token][] {
  const { chainId } = useActiveWeb3React()

  const [tokenA, tokenB] = chainId ? [currencyA?.wrapped, currencyB?.wrapped] : [undefined, undefined]

  return useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB] as [Token, Token],
          ]
            // filter out invalid pairs comprised of the same asset (e.g. WETH<>WETH)
            .filter(([t0, t1]) => !t0.equals(t1))
        : [],
    [tokenA, tokenB, chainId]
  )
}
