import { TokenAmount, Pair, Currency } from '@uniswap/sdk'
import { useMemo } from 'react'
// import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useSingleContractMultipleData } from '../state/multicall/hooks'
import { normalizeToken, wrappedCurrency } from '../utils/wrappedCurrency'
import { useMooniswapV1FactoryContract } from '../hooks/useContract'

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

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
