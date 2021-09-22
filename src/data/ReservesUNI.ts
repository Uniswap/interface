import { Token as TokenUNI, TokenAmount, Pair, Currency, ChainId as ChainIdUNI } from '@uniswap/sdk'
import { useMemo } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          !tokenA.equals(tokenB) &&
          tokenA.chainId in ChainIdUNI &&
          tokenB.chainId in ChainIdUNI
          ? Pair.getAddress(
              new TokenUNI(tokenA.chainId as ChainIdUNI, tokenA.address, tokenA.decimals, tokenA.symbol, tokenA.name),
              new TokenUNI(tokenB.chainId as ChainIdUNI, tokenB.address, tokenB.decimals, tokenB.symbol, tokenB.name)
            )
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

      if (loading) return [PairState.LOADING, null]
      if (
        !tokenA ||
        !tokenB ||
        !(tokenA.chainId in ChainIdUNI) ||
        !(tokenB.chainId in ChainIdUNI) ||
        tokenA.equals(tokenB)
      )
        return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(
            new TokenUNI(token0.chainId as ChainIdUNI, token0.address, token0.decimals, token0.symbol, token0.name),
            reserve0.toString()
          ),
          new TokenAmount(
            new TokenUNI(token1.chainId as ChainIdUNI, token1.address, token1.decimals, token1.symbol, token1.name),
            reserve1.toString()
          )
        )
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
