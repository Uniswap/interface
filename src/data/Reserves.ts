import { TokenAmount, Pair, Currency, JSBI, Token } from 'libs/sdk/src'
import { useMemo } from 'react'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { useFactoryContract } from 'hooks/useContract'
import DMMPool from 'libs/sdk/src/abis/DMMPool.json'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const contract = useFactoryContract()

  const ress = useSingleContractMultipleData(
    contract,
    'getPools',
    tokens
      .filter(([tokenA, tokenB]) => tokenA && tokenB && !tokenA.equals(tokenB))
      .map(([tokenA, tokenB]) => [tokenA?.address, tokenB?.address])
  )
  const result: any[] = []
  let start = 0
  tokens.map(([tokenA, tokenB]) => {
    if (!!(tokenA && tokenB && !tokenA.equals(tokenB))) {
      result.push(ress[start])
      start += 1
    } else {
      result.push('')
    }
  })

  const lens = result.map(item => (!!item.result ? item.result?.[0].length : 0))
  const pairAddresses = result.reduce((acc: string[], i) => {
    if (!!i.result) {
      acc = [...acc, ...i.result?.[0]]
    }
    return acc
  }, [])
  const results = useMultipleContractSingleData(pairAddresses, new Interface(DMMPool.abi), 'getTradeInfo')
  const ampResults = useMultipleContractSingleData(pairAddresses, new Interface(DMMPool.abi), 'ampBps')
  return useMemo(() => {
    start = 0
    const vv: any[] = []
    lens.forEach((len, index) => {
      vv.push([])
      const tokenA = tokens[index][0]
      const tokenB = tokens[index][1]
      if (len > 0) {
        for (let j = 0; j < len; j++) {
          const { result: reserves, loading } = results[start]
          const { result: amp, loading: loadingAmp } = ampResults[start]
          if (loading || loadingAmp) {
            vv[vv.length - 1].push([PairState.LOADING, null])
          } else if (!tokenA || !tokenB || tokenA.equals(tokenB)) {
            vv[vv.length - 1].push([PairState.INVALID, null])
          } else if (!reserves || !amp) {
            vv[vv.length - 1].push([PairState.NOT_EXISTS, null])
          } else {
            const { _reserve0, _reserve1, _vReserve0, _vReserve1, feeInPrecision } = reserves
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
            vv[vv.length - 1].push([
              PairState.EXISTS,
              new Pair(
                pairAddresses[start],
                new TokenAmount(token0, _reserve0.toString()),
                new TokenAmount(token1, _reserve1.toString()),
                new TokenAmount(token0, _vReserve0.toString()),
                new TokenAmount(token1, _vReserve1.toString()),
                JSBI.BigInt(feeInPrecision),
                JSBI.BigInt(amp[0])
              )
            ])
          }
          start += 1
        }
      }
    })
    return vv
  }, [results, tokens, lens])
}

export function usePairsByAddress(
  pairInfo: { address: string | undefined; currencies: [Currency | undefined, Currency | undefined] }[]
): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()
  const results = useMultipleContractSingleData(
    pairInfo.map(info => info.address),
    new Interface(DMMPool.abi),
    'getTradeInfo'
  )
  const ampResults = useMultipleContractSingleData(
    pairInfo.map(info => info.address),
    new Interface(DMMPool.abi),
    'ampBps'
  )

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const { result: amp, loading: loadingAmp } = ampResults[i]
      const tokenA = wrappedCurrency(pairInfo[i].currencies[0], chainId)
      const tokenB = wrappedCurrency(pairInfo[i].currencies[1], chainId)

      if (loading || loadingAmp) return [PairState.LOADING, null]
      if (typeof pairInfo[i].address == 'undefined' || !amp) return [PairState.NOT_EXISTS, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { _reserve0, _reserve1, _vReserve0, _vReserve1, feeInPrecision } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          pairInfo[i].address as string,
          new TokenAmount(token0, _reserve0.toString()),
          new TokenAmount(token1, _reserve1.toString()),
          new TokenAmount(token0, _vReserve0.toString()),
          new TokenAmount(token1, _vReserve1.toString()),
          JSBI.BigInt(feeInPrecision),
          JSBI.BigInt(amp[0])
        )
      ]
    })
  }, [results])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null][] {
  return usePairs([[tokenA, tokenB]])[0]
}

export function usePairByAddress(tokenA?: Token, tokenB?: Token, address?: string): [PairState, Pair | null] {
  return usePairsByAddress([{ address, currencies: [tokenA, tokenB] }])[0]
}

export function useUnAmplifiedPairs(currencies: [Currency | undefined, Currency | undefined][]): string[] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )
  const contract = useFactoryContract()
  const ress = useSingleContractMultipleData(
    contract,
    'getUnamplifiedPool',
    tokens
      .filter(([tokenA, tokenB]) => tokenA && tokenB && !tokenA.equals(tokenB))
      .map(([tokenA, tokenB]) => [tokenA?.address, tokenB?.address])
  )
  return useMemo(() => {
    return ress.map(res => {
      const { result } = res
      return result?.[0]
    })
  }, [tokens, ress])
}

export function useUnAmplifiedPairsFull(
  currencies: [Currency | undefined, Currency | undefined][]
): [PairState, Pair | null][] {
  const pairAddresses = useUnAmplifiedPairs(currencies)
  return usePairsByAddress(pairAddresses.map((address, index) => ({ address, currencies: currencies[index] })))
}

export function useUnAmplifiedPair(tokenA?: Currency, tokenB?: Currency): string {
  return useUnAmplifiedPairs([[tokenA, tokenB]])[0]
}

// export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
//   return usePairs([[tokenA, tokenB]])[0]
// }

// export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
//   const { chainId } = useActiveWeb3React()

//   const tokens = useMemo(
//     () =>
//       currencies.map(([currencyA, currencyB]) => [
//         wrappedCurrency(currencyA, chainId),
//         wrappedCurrency(currencyB, chainId)
//       ]),
//     [chainId, currencies]
//   )

//   const pairAddresses = useMemo(
//     () =>
//       tokens.map(([tokenA, tokenB]) => {
//         return tokenA && tokenB && !tokenA.equals(tokenB) ? undefined : undefined
//       }),
//     [tokens]
//   )

//   const results = useMultipleContractSingleData(pairAddresses, new Interface(DMMPool.abi), 'getTradeInfo')

//   return useMemo(() => {
//     return results.map((result, i) => {
//       const { result: reserves, loading } = result
//       const tokenA = tokens[i][0]
//       const tokenB = tokens[i][1]

//       if (loading) return [PairState.LOADING, null]
//       if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
//       if (!reserves) return [PairState.NOT_EXISTS, null]
//       const { _reserve0, _reserve1, feeInPrecision } = reserves

//       const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
//       return [
//         PairState.EXISTS,
//         new Pair(
//           "",
//           new TokenAmount(token0, _reserve0.toString()),
//           new TokenAmount(token1, _reserve1.toString()),
//           new TokenAmount(token0, _reserve0.toString()),
//           new TokenAmount(token1, _reserve1.toString()),
//           JSBI.BigInt(feeInPrecision)
//         )
//       ]
//     })
//   }, [results, tokens])
// }
