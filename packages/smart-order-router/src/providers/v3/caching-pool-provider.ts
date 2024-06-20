import { ChainId, Token } from '@ubeswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import _ from 'lodash'

import { metric, MetricLoggerUnit } from '../../util'
import { log } from '../../util/log'

import { ICache } from './../cache'
import { ProviderConfig } from './../provider'
import { IV3PoolProvider, V3PoolAccessor } from './pool-provider'

/**
 * Provider for getting V3 pools, with functionality for caching the results.
 * Does not cache by block because we compute quotes using the on-chain quoter
 * so do not mind if the liquidity values are out of date.
 *
 * @export
 * @class CachingV3PoolProvider
 */
export class CachingV3PoolProvider implements IV3PoolProvider {
  private POOL_KEY = (chainId: ChainId, address: string) => `pool-${chainId}-${address}`

  /**
   * Creates an instance of CachingV3PoolProvider.
   * @param chainId The chain id to use.
   * @param poolProvider The provider to use to get the pools when not in the cache.
   * @param cache Cache instance to hold cached pools.
   */
  constructor(protected chainId: ChainId, protected poolProvider: IV3PoolProvider, private cache: ICache<Pool>) {}

  public async getPools(
    tokenPairs: [Token, Token, FeeAmount][],
    providerConfig?: ProviderConfig
  ): Promise<V3PoolAccessor> {
    const poolAddressSet: Set<string> = new Set<string>()
    const poolsToGetTokenPairs: Array<[Token, Token, FeeAmount]> = []
    const poolsToGetAddresses: string[] = []
    const poolAddressToPool: { [poolAddress: string]: Pool } = {}

    for (const [tokenA, tokenB, feeAmount] of tokenPairs) {
      const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB, feeAmount)

      if (poolAddressSet.has(poolAddress)) {
        continue
      }

      poolAddressSet.add(poolAddress)

      const cachedPool = await this.cache.get(this.POOL_KEY(this.chainId, poolAddress))
      if (cachedPool) {
        metric.putMetric('V3_INMEMORY_CACHING_POOL_HIT_IN_MEMORY', 1, MetricLoggerUnit.None)
        poolAddressToPool[poolAddress] = cachedPool
        continue
      }

      metric.putMetric('V3_INMEMORY_CACHING_POOL_MISS_NOT_IN_MEMORY', 1, MetricLoggerUnit.None)
      poolsToGetTokenPairs.push([token0, token1, feeAmount])
      poolsToGetAddresses.push(poolAddress)
    }

    log.info(
      {
        poolsFound: _.map(Object.values(poolAddressToPool), (p) => `${p.token0.symbol} ${p.token1.symbol} ${p.fee}`),
        poolsToGetTokenPairs: _.map(poolsToGetTokenPairs, (t) => `${t[0].symbol} ${t[1].symbol} ${t[2]}`),
      },
      `Found ${
        Object.keys(poolAddressToPool).length
      } V3 pools already in local cache. About to get liquidity and slot0s for ${poolsToGetTokenPairs.length} pools.`
    )

    if (poolsToGetAddresses.length > 0) {
      const poolAccessor = await this.poolProvider.getPools(poolsToGetTokenPairs, providerConfig)
      for (const address of poolsToGetAddresses) {
        const pool = poolAccessor.getPoolByAddress(address)
        if (pool) {
          poolAddressToPool[address] = pool
          // We don't want to wait for this caching to complete before returning the pools.
          this.cache.set(this.POOL_KEY(this.chainId, address), pool)
        }
      }
    }

    return {
      getPool: (tokenA: Token, tokenB: Token, feeAmount: FeeAmount): Pool | undefined => {
        const { poolAddress } = this.getPoolAddress(tokenA, tokenB, feeAmount)
        return poolAddressToPool[poolAddress]
      },
      getPoolByAddress: (address: string): Pool | undefined => poolAddressToPool[address],
      getAllPools: (): Pool[] => Object.values(poolAddressToPool),
    }
  }

  public getPoolAddress(
    tokenA: Token,
    tokenB: Token,
    feeAmount: FeeAmount
  ): { poolAddress: string; token0: Token; token1: Token } {
    return this.poolProvider.getPoolAddress(tokenA, tokenB, feeAmount)
  }
}
