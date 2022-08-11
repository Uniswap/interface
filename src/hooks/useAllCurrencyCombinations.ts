import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { useActiveWeb3React } from './index'

export function useAllCurrencyCombinations(currencyA?: Currency, currencyB?: Currency): [Token, Token][] {
  const { chainId } = useActiveWeb3React()

  // const basePairs: [Token, Token][] = useMemo(
  //   () =>
  //     flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
  //       ([t0, t1]) => t0.address !== t1.address
  //     ),
  //   [bases]
  // )

  return useMemo(() => {
    const tokenA = currencyA?.wrapped
    const tokenB = currencyB?.wrapped
    const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

    const basePairs: [Token, Token][] = []
    for (let i = 0; i < bases.length - 1; i++) {
      for (let j = i + 1; j < bases.length; j++) {
        basePairs.push([bases[i], bases[j]])
      }
    }

    const AAgainstAllBase =
      tokenA && bases.filter(base => base.address === tokenA?.address).length <= 0
        ? bases.map((base): [Token, Token] => [tokenA, base])
        : []

    const BAgainstAllBase =
      tokenB && bases.filter(base => base.address === tokenB?.address).length <= 0
        ? bases.map((base): [Token, Token] => [tokenB, base])
        : []

    const directPair =
      tokenA &&
      tokenB &&
      bases.filter(base => base.address === tokenA?.address).length <= 0 &&
      bases.filter(base => base.address === tokenB?.address).length <= 0
        ? [[tokenA, tokenB]]
        : []

    return tokenA && tokenB
      ? [
          // the direct pair
          ...directPair,
          // token A against all bases
          ...AAgainstAllBase,
          // token B against all bases
          ...BAgainstAllBase,
          // each base against all bases
          ...basePairs,
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
      : []
  }, [chainId, currencyA, currencyB])
}
