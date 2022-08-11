import { JSBI, Pair } from '@kyberswap/ks-sdk-classic'
import { Currency, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import DMM_POOL_INTERFACE from 'constants/abis/dmmPool'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import {
  useDynamicFeeFactoryContract,
  useOldStaticFeeFactoryContract,
  useStaticFeeFactoryContract,
} from 'hooks/useContract'
import { useMultipleContractSingleData, useSingleContractMultipleData } from 'state/multicall/hooks'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][][] {
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies],
  )

  const oldStaticContract = useOldStaticFeeFactoryContract()
  const staticContract = useStaticFeeFactoryContract()
  const dynamicContract = useDynamicFeeFactoryContract()

  const callInputs = useMemo(
    () =>
      tokens
        .filter(([tokenA, tokenB]) => tokenA && tokenB && !tokenA.equals(tokenB))
        .map(([tokenA, tokenB]) => [tokenA?.address, tokenB?.address]),
    [tokens],
  )
  const oldStaticRess = useSingleContractMultipleData(oldStaticContract, 'getPools', callInputs)
  const staticRess = useSingleContractMultipleData(staticContract, 'getPools', callInputs)
  const dynamicRess = useSingleContractMultipleData(dynamicContract, 'getPools', callInputs)
  const result: any[] = useMemo(() => {
    const res: any[] = []
    let start = 0

    tokens.forEach(([tokenA, tokenB]) => {
      if (
        !!(tokenA && tokenB && !tokenA.equals(tokenB)) &&
        (!!oldStaticRess[start] || !!staticRess[start] || !!dynamicRess[start])
      ) {
        res.push(oldStaticRess[start])
        res.push(staticRess[start])
        res.push(dynamicRess[start])
        start += 1
      } else {
        res.push('')
      }
    })

    return res
  }, [dynamicRess, oldStaticRess, staticRess, tokens])

  const lens = useMemo(() => result.map(item => (!!item?.result ? item.result?.[0].length : 0)), [result])
  const pairAddresses = useMemo(
    () =>
      result.reduce((acc: string[], i) => {
        if (!!i?.result) {
          acc = [...acc, ...i.result?.[0]]
        }
        return acc
      }, []),
    [result],
  )
  const results = useMultipleContractSingleData(pairAddresses, DMM_POOL_INTERFACE, 'getTradeInfo')
  const ampResults = useMultipleContractSingleData(pairAddresses, DMM_POOL_INTERFACE, 'ampBps')

  return useMemo(() => {
    let start = 0
    const vv: any[] = []
    lens.forEach((len, index) => {
      vv.push([])
      const tokenA = tokens[index]?.[0]
      const tokenB = tokens[index]?.[1]
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
              // TODO: Check reserve
              new Pair(
                pairAddresses[start],
                TokenAmount.fromRawAmount(token0, _reserve0.toString()),
                TokenAmount.fromRawAmount(token1, _reserve1.toString()),
                TokenAmount.fromRawAmount(token0, _vReserve0.toString()),
                TokenAmount.fromRawAmount(token1, _vReserve1.toString()),
                JSBI.BigInt(feeInPrecision),
                JSBI.BigInt(amp[0]),
              ),
            ])
          }
          start += 1
        }
      }
    })
    return vv
  }, [results, lens, ampResults, pairAddresses, tokens])
}

export function usePairsByAddress(
  pairInfo: { address: string | undefined; currencies: [Currency | undefined, Currency | undefined] }[],
): [PairState, Pair | null, boolean?, boolean?][] {
  const { chainId } = useActiveWeb3React()
  const results = useMultipleContractSingleData(
    pairInfo.map(info => info.address),
    DMM_POOL_INTERFACE,
    'getTradeInfo',
  )
  const ampResults = useMultipleContractSingleData(
    pairInfo.map(info => info.address),
    DMM_POOL_INTERFACE,
    'ampBps',
  )
  const factories = useMultipleContractSingleData(
    pairInfo.map(info => info.address),
    DMM_POOL_INTERFACE,
    'factory',
  )

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const { result: amp, loading: loadingAmp } = ampResults[i]
      const { result: factoryAddresses } = factories[i]
      const tokenA = pairInfo[i].currencies[0]?.wrapped
      const tokenB = pairInfo[i].currencies[1]?.wrapped

      if (loading || loadingAmp) return [PairState.LOADING, null]
      if (typeof pairInfo[i].address === 'undefined' || !amp) return [PairState.NOT_EXISTS, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { _reserve0, _reserve1, _vReserve0, _vReserve1, feeInPrecision } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      const isStaticFeePair =
        chainId && factoryAddresses && factoryAddresses[0] === NETWORKS_INFO[chainId].classic.static.factory
      const isOldStaticFeeContract =
        chainId && factoryAddresses && factoryAddresses[0] === NETWORKS_INFO[chainId].classic.oldStatic?.factory
      return [
        PairState.EXISTS,
        new Pair(
          pairInfo[i].address as string,
          TokenAmount.fromRawAmount(token0, _reserve0.toString()),
          TokenAmount.fromRawAmount(token1, _reserve1.toString()),
          TokenAmount.fromRawAmount(token0, _vReserve0.toString()),
          TokenAmount.fromRawAmount(token1, _vReserve1.toString()),
          JSBI.BigInt(feeInPrecision),
          JSBI.BigInt(amp[0]),
        ),
        isStaticFeePair || isOldStaticFeeContract,
        isOldStaticFeeContract,
      ]
    })
  }, [chainId, pairInfo, results, ampResults, factories])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null][] {
  return usePairs([[tokenA, tokenB]])[0]
}

export function usePairByAddress(
  tokenA?: Token,
  tokenB?: Token,
  address?: string,
): [PairState, Pair | null, boolean?, boolean?] {
  return usePairsByAddress([{ address, currencies: [tokenA, tokenB] }])[0]
}

export function useUnAmplifiedPairs(currencies: [Currency | undefined, Currency | undefined][]): string[] {
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies],
  )
  const dynamicContract = useDynamicFeeFactoryContract()
  const dynamicRess = useSingleContractMultipleData(
    dynamicContract,
    'getUnamplifiedPool',
    tokens
      .filter(([tokenA, tokenB]) => tokenA && tokenB && !tokenA.equals(tokenB))
      .map(([tokenA, tokenB]) => [tokenA?.address, tokenB?.address]),
  )

  const staticContract = useStaticFeeFactoryContract()
  const staticRess = useSingleContractMultipleData(
    staticContract,
    'getUnamplifiedPool',
    tokens
      .filter(([tokenA, tokenB]) => tokenA && tokenB && !tokenA.equals(tokenB))
      .map(([tokenA, tokenB]) => [tokenA?.address, tokenB?.address]),
  )

  return useMemo(() => {
    return [...staticRess, ...dynamicRess].map(res => {
      const { result } = res
      return result?.[0]
    })
  }, [dynamicRess, staticRess])
}

export function useUnAmplifiedPairsFull(
  currencies: [Currency | undefined, Currency | undefined][],
): [PairState, Pair | null, boolean?, boolean?][] {
  const pairAddresses = useUnAmplifiedPairs(currencies)
  return usePairsByAddress(pairAddresses.map((address, index) => ({ address, currencies: currencies[index] })))
}

export function useUnAmplifiedPair(tokenA?: Currency, tokenB?: Currency): string[] {
  return useUnAmplifiedPairs([[tokenA, tokenB]])
}
