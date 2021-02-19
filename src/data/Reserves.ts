import { TokenAmount, Pair, Currency, SupportedPlatform } from 'dxswap-sdk'
import { useMemo } from 'react'
import { abi as IDXswapPairABI } from 'dxswap-core/build/IDXswapPair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { useFeesState } from '../state/fees/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

const PAIR_INTERFACE = new Interface(IDXswapPairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined][],
  platform: SupportedPlatform = SupportedPlatform.SWAPR
): [PairState, Pair | null][] {
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
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB, platform) : undefined
      }),
    [tokens]
  )

  const { swapFees, protocolFeeDenominator } = useFeesState()

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

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
      const swapFee =
        swapFees && swapFees[Pair.getAddress(token0, token1, platform)] && swapFees[Pair.getAddress(token0, token1, platform)].fee
          ? swapFees[Pair.getAddress(token0, token1, platform)].fee
          : // default to 0.25% in case the "real" swap fee is not ready to be queried (https://github.com/levelkdev/dxswap-dapp/issues/150)
            BigInt(25)
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          swapFee,
          protocolFeeDenominator ? BigInt(protocolFeeDenominator) : BigInt(0),
          platform
        )
      ]
    })
  }, [protocolFeeDenominator, results, swapFees, tokens])
}

export function usePair(
  tokenA?: Currency,
  tokenB?: Currency,
  platform?: SupportedPlatform
): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]], platform)[0]
}
