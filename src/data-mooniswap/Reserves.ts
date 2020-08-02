import { TokenAmount, Pair, Currency } from '@uniswap/sdk'
import { useMemo } from 'react'
// import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useSingleContractMultipleData } from '../state/multicall/hooks'
import { normalizeToken, wrappedCurrency } from '../utils/wrappedCurrency'
import { useMooniswapV1FactoryContract } from '../hooks/useContract'
import { useCurrencyBalances, useTokenBalances } from '../state/wallet/hooks'
import { V1_MOONISWAP_FACTORY_ADDRESSES } from '../constants/v1'

// const MOONISWAP_PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [normalizeToken(currencyA), normalizeToken(currencyB)]),
    [chainId, currencies]
  )

  const tokenPairs: (string[] | undefined)[] = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB)
          ? [tokenA.address, tokenB.address]
          : [ZERO_ADDRESS, ZERO_ADDRESS]
      }),
    [tokens]
  )

  const results = useSingleContractMultipleData(useMooniswapV1FactoryContract(), 'pools', tokenPairs)

  // todo: fetch it from Pool not from factory
  const balResult = useTokenBalances(chainId && V1_MOONISWAP_FACTORY_ADDRESSES[chainId], ...tokens)

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!result.result) return [PairState.NOT_EXISTS, null]
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          // @ts-ignore
          new TokenAmount(token0, balResult[token0.address].toString()),
          // @ts-ignore
          new TokenAmount(token1, balResult[token1.address].toString())
        )
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
