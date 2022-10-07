import { Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';

import { ChainId } from '../../util/chains';
import { log } from '../../util/log';

import { ICache } from './../cache';
import { ProviderConfig } from './../provider';
import { IV3PoolProvider, V3PoolAccessor } from './pool-provider';

/**
 * Provider for getting V3 pools, with functionality for caching the results.
 *
 * @export
 * @class CachingV3PoolProvider
 */
export class CachingV3PoolProvider implements IV3PoolProvider {
  private POOL_KEY = (chainId: ChainId, address: string) =>
    `pool-${chainId}-${address}`;

  /**
   * Creates an instance of CachingV3PoolProvider.
   * @param chainId The chain id to use.
   * @param poolProvider The provider to use to get the pools when not in the cache.
   * @param cache Cache instance to hold cached pools.
   */
  constructor(
    protected chainId: ChainId,
    protected poolProvider: IV3PoolProvider,
    private cache: ICache<Pool>
  ) {}

  public async getPools(
    tokenPairs: [Token, Token, FeeAmount][],
    providerConfig?: ProviderConfig
  ): Promise<V3PoolAccessor> {
    const poolAddressSet: Set<string> = new Set<string>();
    const poolsToGetTokenPairs: Array<[Token, Token, FeeAmount]> = [];
    const poolsToGetAddresses: string[] = [];
    const poolAddressToPool: { [poolAddress: string]: Pool } = {};

    for (const [tokenA, tokenB, feeAmount] of tokenPairs) {
      const { poolAddress, token0, token1 } = this.getPoolAddress(
        tokenA,
        tokenB,
        feeAmount
      );

      if (poolAddressSet.has(poolAddress)) {
        continue;
      }

      poolAddressSet.add(poolAddress);

      const cachedPool = await this.cache.get(
        this.POOL_KEY(this.chainId, poolAddress)
      );
      if (cachedPool) {
        poolAddressToPool[poolAddress] = cachedPool;
        continue;
      }

      poolsToGetTokenPairs.push([token0, token1, feeAmount]);
      poolsToGetAddresses.push(poolAddress);
    }

    log.info(
      `Found ${
        Object.keys(poolAddressToPool).length
      } pools already in local cache. About to get liquidity and slot0s for ${
        poolsToGetTokenPairs.length
      } pools.`
    );

    if (poolsToGetAddresses.length > 0) {
      const poolAccessor = await this.poolProvider.getPools(
        poolsToGetTokenPairs,
        providerConfig
      );
      for (const address of poolsToGetAddresses) {
        const pool = poolAccessor.getPoolByAddress(address);
        if (pool) {
          poolAddressToPool[address] = pool;
          await this.cache.set(this.POOL_KEY(this.chainId, address), pool);
        }
      }
    }

    return {
      getPool: (
        tokenA: Token,
        tokenB: Token,
        feeAmount: FeeAmount
      ): Pool | undefined => {
        const { poolAddress } = this.getPoolAddress(tokenA, tokenB, feeAmount);
        return poolAddressToPool[poolAddress];
      },
      getPoolByAddress: (address: string): Pool | undefined =>
        poolAddressToPool[address],
      getAllPools: (): Pool[] => Object.values(poolAddressToPool),
    };
  }

  public getPoolAddress(
    tokenA: Token,
    tokenB: Token,
    feeAmount: FeeAmount
  ): { poolAddress: string; token0: Token; token1: Token } {
    return this.poolProvider.getPoolAddress(tokenA, tokenB, feeAmount);
  }
}
