import { TokenAmount, Pair, Currency, Token } from 'dxswap-sdk'
import { useMemo } from 'react'
import { abi as IDXswapPairABI } from 'dxswap-core/build/IDXswapPair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { useFeesState } from '../state/fees/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { usePairContract } from '../hooks/useContract'
import { useToken } from '../hooks/Tokens'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useTrackedTokenPairs } from '../state/user/hooks'

const PAIR_INTERFACE = new Interface(IDXswapPairABI)

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
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
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
        swapFees && swapFees[Pair.getAddress(token0, token1)] && swapFees[Pair.getAddress(token0, token1)].fee
          ? swapFees[Pair.getAddress(token0, token1)].fee
          : // default to 0.25% in case the "real" swap fee is not ready to be queried (https://github.com/levelkdev/dxswap-dapp/issues/150)
            BigInt(25)
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          swapFee,
          protocolFeeDenominator ? BigInt(protocolFeeDenominator) : BigInt(0)
        )
      ]
    })
  }, [protocolFeeDenominator, results, swapFees, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}

export function useExistingRawPairs(): Pair[] {
  const rawPairsList = useTrackedTokenPairs()
  const results = usePairs(rawPairsList)

  return useMemo(() => {
    return results.reduce((existingPairs: Pair[], result) => {
      if (result && result[0] === PairState.EXISTS && result[1]) {
        existingPairs.push(result[1])
      }
      return existingPairs
    }, [])
  }, [results])
}

export function useAggregatedByToken0ExistingPairs(): {
  loading: boolean
  aggregatedData: {
    token0: Token
    pairsNumber: number
  }[]
} {
  const rawPairsList = useTrackedTokenPairs()
  const results = usePairs(rawPairsList)

  return useMemo(() => {
    const loading = !!results.find(result => result[0] === PairState.LOADING)
    if (loading) {
      return { loading, aggregatedData: [] }
    }
    const rawData = results.reduce(
      (
        rawAggregatedPairs: {
          [token0Address: string]: {
            token0: Token
            pairsNumber: number
          }
        },
        result
      ) => {
        if (result && result[0] === PairState.EXISTS && result[1]) {
          const pairToken0 = result[1].token0
          if (!!rawAggregatedPairs[pairToken0.address]) {
            rawAggregatedPairs[pairToken0.address].pairsNumber++
          } else {
            rawAggregatedPairs[pairToken0.address] = {
              token0: pairToken0,
              pairsNumber: 1
            }
          }
        }
        return rawAggregatedPairs
      },
      {}
    )
    return { loading: false, aggregatedData: Object.values(rawData) }
  }, [results])
}

export function usePairsByToken0(
  token0?: Token | null
): {
  loading: boolean
  pairs: Pair[]
} {
  const rawPairsList = useTrackedTokenPairs()
  const results = usePairs(rawPairsList)

  return useMemo(() => {
    const loading = !!results.find(result => result[0] === PairState.LOADING)
    if (loading) {
      return { loading, pairs: [] }
    }
    return {
      loading: false,
      pairs: results.reduce((pairs: Pair[], result) => {
        if (result && result[0] === PairState.EXISTS && result[1] && result[1].token0.address === token0?.address) {
          pairs.push(result[1])
        }
        return pairs
      }, [])
    }
  }, [results, token0])
}

export function usePairAtAddress(address?: string): Pair | null {
  const pairContract = usePairContract(address)
  const { result: token0Result } = useSingleCallResult(pairContract, 'token0()')
  const { result: token1Result } = useSingleCallResult(pairContract, 'token1()')
  const token0 = useToken(token0Result && token0Result[0])
  const token1 = useToken(token1Result && token1Result[0])
  const result = usePair(token0 || undefined, token1 || undefined)
  return result[0] === PairState.EXISTS && result[1] ? result[1] : null
}
