import { BigintIsh, Currency, Token, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePoolAddress, FeeAmount, Pool } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContracts } from 'wagmi'

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
export class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []
  private static addresses: { key: string; address: string }[] = []

  static getPoolAddress({
    factoryAddress,
    tokenA,
    tokenB,
    fee,
    chainId,
  }: {
    factoryAddress: string
    tokenA: Token
    tokenB: Token
    fee: FeeAmount
    chainId: EVMUniverseChainId
  }): string {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2)
    }

    const { address: addressA } = tokenA
    const { address: addressB } = tokenB
    const key = `${factoryAddress}:${addressA}:${addressB}:${fee.toString()}`
    const found = this.addresses.find((address) => address.key === key)
    if (found) {
      return found.address
    }

    const address = {
      key,
      address: computePoolAddress({
        factoryAddress,
        tokenA,
        tokenB,
        fee,
        chainId: chainId as number,
      }),
    }
    this.addresses.unshift(address)
    return address.address
  }

  static getPool({
    tokenA,
    tokenB,
    fee,
    sqrtPriceX96,
    liquidity,
    tick,
  }: {
    tokenA: Token
    tokenB: Token
    fee: FeeAmount
    sqrtPriceX96: BigintIsh
    liquidity: BigintIsh
    tick: number
  }): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2)
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick,
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
  LOADING = 0,
  NOT_EXISTS = 1,
  EXISTS = 2,
  INVALID = 3,
}

export function usePools(
  poolKeys: [Maybe<Currency>, Maybe<Currency>, FeeAmount | undefined][],
  chainId: EVMUniverseChainId | undefined,
): [PoolState, Pool | null][] {
  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) {
      return new Array(poolKeys.length)
    }

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped
        const tokenB = currencyB.wrapped
        if (tokenA.equals(tokenB)) {
          return undefined
        }

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, feeAmount] : [tokenB, tokenA, feeAmount]
      }
      return undefined
    })
  }, [chainId, poolKeys])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
    if (!v3CoreFactoryAddress) {
      return Array(poolTokens.length).fill(undefined)
    }

    return poolTokens.map(
      (value) =>
        value &&
        PoolCache.getPoolAddress({
          factoryAddress: v3CoreFactoryAddress,
          tokenA: value[0],
          tokenB: value[1],
          fee: value[2],
          chainId,
        }),
    )
  }, [chainId, poolTokens])

  const { data: slot0s, isLoading: slot0sLoading } = useReadContracts({
    contracts: useMemo(() => {
      return poolAddresses.map(
        (address) =>
          ({
            address: assume0xAddress(address) ?? '0x', // Edge case: if an address is undefined, we pass in a blank address to keep the result array the same length as poolAddresses
            abi: [
              {
                inputs: [],
                name: 'slot0',
                outputs: [
                  {
                    internalType: 'uint160',
                    name: 'sqrtPriceX96',
                    type: 'uint160',
                  },
                  {
                    internalType: 'int24',
                    name: 'tick',
                    type: 'int24',
                  },
                  {
                    internalType: 'uint16',
                    name: 'observationIndex',
                    type: 'uint16',
                  },
                  {
                    internalType: 'uint16',
                    name: 'observationCardinality',
                    type: 'uint16',
                  },
                  {
                    internalType: 'uint16',
                    name: 'observationCardinalityNext',
                    type: 'uint16',
                  },
                  {
                    internalType: 'uint8',
                    name: 'feeProtocol',
                    type: 'uint8',
                  },
                  {
                    internalType: 'bool',
                    name: 'unlocked',
                    type: 'bool',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'slot0',
            chainId,
          }) as const,
      )
    }, [poolAddresses, chainId]),
  })

  const { data: liquidities, isLoading: liquiditiesLoading } = useReadContracts({
    contracts: useMemo(() => {
      return poolAddresses.map(
        (address) =>
          ({
            address: assume0xAddress(address) ?? '0x', // Edge case: if an address is undefined, we pass in a blank address to keep the result array the same length as poolAddresses
            abi: [
              {
                inputs: [],
                name: 'liquidity',
                outputs: [
                  {
                    internalType: 'uint128',
                    name: '',
                    type: 'uint128',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'liquidity',
            chainId,
          }) as const,
      )
    }, [poolAddresses, chainId]),
  })

  return useComputePoolState({
    poolKeys,
    slot0s,
    slot0sLoading,
    liquidities,
    liquiditiesLoading,
    poolTokens,
  })
}

export function useComputePoolState({
  poolKeys,
  slot0s,
  slot0sLoading,
  liquidities,
  liquiditiesLoading,
  poolTokens,
}: {
  poolKeys: [Maybe<Currency>, Maybe<Currency>, FeeAmount | undefined][]
  slot0s?: (
    | {
        error: Error
        result?: undefined
        status: 'failure'
      }
    | {
        error?: undefined
        result: readonly [bigint, number, number, number, number, number, boolean]
        status: 'success'
      }
  )[]
  slot0sLoading: boolean
  liquidities?: (
    | {
        error: Error
        result?: undefined
        status: 'failure'
      }
    | {
        error?: undefined
        result: bigint
        status: 'success'
      }
  )[]
  liquiditiesLoading: boolean
  poolTokens: ([Token, Token, FeeAmount] | undefined)[]
}): [PoolState, Pool | null][] {
  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      if (slot0sLoading || liquiditiesLoading) {
        return [PoolState.LOADING, null]
      }

      const tokens = poolTokens[index]
      const slot0 = slot0s?.[index]
      const liquidity = liquidities?.[index]
      if (!tokens || !slot0 || !liquidity) {
        return [PoolState.INVALID, null]
      }

      if (!slot0.result) {
        return [PoolState.NOT_EXISTS, null]
      }

      if (typeof liquidity.result !== 'bigint') {
        return [PoolState.NOT_EXISTS, null]
      }

      const [token0, token1, fee] = tokens
      const [sqrtPriceX96, tick] = slot0.result

      if (!sqrtPriceX96 || sqrtPriceX96 === 0n) {
        return [PoolState.NOT_EXISTS, null]
      }

      try {
        const pool = PoolCache.getPool({
          tokenA: token0,
          tokenB: token1,
          fee,
          sqrtPriceX96: sqrtPriceX96.toString(),
          liquidity: liquidity.result.toString(),
          tick,
        })
        return [PoolState.EXISTS, pool]
      } catch (error) {
        logger.error(error, {
          tags: {
            file: 'usePools',
            function: 'usePools',
          },
          extra: {
            token0: token0.address,
            token1: token1.address,
            chainId: token0.chainId,
            fee,
          },
        })
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [poolKeys, slot0sLoading, liquiditiesLoading, poolTokens, slot0s, liquidities])
}

export function usePool({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA?: Maybe<Currency>
  currencyB?: Maybe<Currency>
  feeAmount?: FeeAmount
}): [PoolState, Pool | null] {
  const poolKeys: [Maybe<Currency>, Maybe<Currency>, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount],
  )

  return usePools(poolKeys, currencyA?.chainId)[0]
}
