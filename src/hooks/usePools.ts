import { computePoolAddress } from '@uniswap/v3-sdk'
import { V3_CORE_FACTORY_ADDRESSES } from '../constants/addresses'
import { IUniswapV3PoolStateInterface } from '../types/v3/IUniswapV3PoolState'
import { Token, Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useActiveWeb3React } from './web3'
import { useMultipleContractSingleData } from '../state/multicall/hooks'

import { Pool, FeeAmount } from '@uniswap/v3-sdk'
import { abi as IUniswapV3PoolStateABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { Interface } from '@ethersproject/abi'

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI) as IUniswapV3PoolStateInterface

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useActiveWeb3React()

  const transformed: ([Token, Token, FeeAmount] | null)[] = useMemo(() => {
    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (!chainId || !currencyA || !currencyB || !feeAmount) return null

      const tokenA = currencyA?.wrapped
      const tokenB = currencyB?.wrapped
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [token0, token1, feeAmount]
    })
  }, [chainId, poolKeys])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]

    return transformed.map((value) => {
      if (!v3CoreFactoryAddress || !value) return undefined
      return computePoolAddress({
        factoryAddress: v3CoreFactoryAddress,
        tokenA: value[0],
        tokenB: value[1],
        fee: value[2],
      })
    })
  }, [chainId, transformed])

  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0')
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity')

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const [token0, token1, fee] = transformed[index] ?? []
      if (!token0 || !token1 || !fee) return [PoolState.INVALID, null]

      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index]
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index]

      if (!slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null]

      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]

      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {
        return [PoolState.EXISTS, new Pool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [liquidities, poolKeys, slot0s, transformed])
}

export function usePool(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): [PoolState, Pool | null] {
  const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount]
  )

  return usePools(poolKeys)[0]
}
