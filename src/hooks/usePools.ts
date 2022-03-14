import { Interface } from '@ethersproject/abi'
import { BigintIsh, Currency, Token } from '@uniswap/sdk-core'
import IUniswapV3PoolStateJson from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { computePoolAddress } from '@uniswap/v3-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { V3_CORE_FACTORY_ADDRESSES } from '../constants/addresses'
import { IUniswapV3PoolStateInterface } from '../types/v3/IUniswapV3PoolState'

const { abi: IUniswapV3PoolStateABI } = IUniswapV3PoolStateJson

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI) as IUniswapV3PoolStateInterface

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // pools is a FIFO, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number
  ): Pool {
    // Evict after 128 entries. Empirically, a swap uses 64 entries.
    if (this.pools.length > 128) {
      this.pools = this.pools.slice(0, 64)
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick
    )
    if (found) {
      return found
    }

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick)
    this.pools.unshift(pool)
    return pool
  }
}

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

  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length)

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped
        const tokenB = currencyB.wrapped
        if (tokenA.equals(tokenB)) return undefined

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, feeAmount] : [tokenB, tokenA, feeAmount]
      }
      return undefined
    })
  }, [chainId, poolKeys])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
    if (!v3CoreFactoryAddress) return new Array(poolTokens.length)

    return poolTokens.map(
      (value) =>
        value &&
        computePoolAddress({
          factoryAddress: v3CoreFactoryAddress,
          tokenA: value[0],
          tokenB: value[1],
          fee: value[2],
        })
    )
  }, [chainId, poolTokens])

  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0')
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity')

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const tokens = poolTokens[index]
      if (!tokens) return [PoolState.INVALID, null]
      const [token0, token1, fee] = tokens

      if (!slot0s[index]) return [PoolState.INVALID, null]
      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index]

      if (!liquidities[index]) return [PoolState.INVALID, null]
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index]

      if (!tokens || !slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null]
      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {
        const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)
        return [PoolState.EXISTS, pool]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [liquidities, poolKeys, slot0s, poolTokens])
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
