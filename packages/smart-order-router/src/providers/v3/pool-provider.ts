import { BigNumber } from '@ethersproject/bignumber';
import { Token } from '@uniswap/sdk-core';
import { computePoolAddress, FeeAmount, Pool } from '@uniswap/v3-sdk';
import retry, { Options as RetryOptions } from 'async-retry';
import _ from 'lodash';

import { IUniswapV3PoolState__factory } from '../../types/v3/factories/IUniswapV3PoolState__factory';
import { ChainId } from '../../util';
import { V3_CORE_FACTORY_ADDRESSES } from '../../util/addresses';
import { log } from '../../util/log';
import { poolToString } from '../../util/routes';
import { IMulticallProvider, Result } from '../multicall-provider';
import { ProviderConfig } from '../provider';

type ISlot0 = {
  sqrtPriceX96: BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
};

type ILiquidity = { liquidity: BigNumber };

/**
 * Provider or getting V3 pools.
 *
 * @export
 * @interface IV3PoolProvider
 */
export interface IV3PoolProvider {
  /**
   * Gets the specified pools.
   *
   * @param tokenPairs The token pairs and fee amount of the pools to get.
   * @param [providerConfig] The provider config.
   * @returns A pool accessor with methods for accessing the pools.
   */
  getPools(
    tokenPairs: [Token, Token, FeeAmount][],
    providerConfig?: ProviderConfig
  ): Promise<V3PoolAccessor>;

  /**
   * Gets the pool address for the specified token pair and fee tier.
   *
   * @param tokenA Token A in the pool.
   * @param tokenB Token B in the pool.
   * @param feeAmount The fee amount of the pool.
   * @returns The pool address and the two tokens.
   */
  getPoolAddress(
    tokenA: Token,
    tokenB: Token,
    feeAmount: FeeAmount
  ): { poolAddress: string; token0: Token; token1: Token };
}

export type V3PoolAccessor = {
  getPool: (
    tokenA: Token,
    tokenB: Token,
    feeAmount: FeeAmount
  ) => Pool | undefined;
  getPoolByAddress: (address: string) => Pool | undefined;
  getAllPools: () => Pool[];
};

export type V3PoolRetryOptions = RetryOptions;

export class V3PoolProvider implements IV3PoolProvider {
  // Computing pool addresses is slow as it requires hashing, encoding etc.
  // Addresses never change so can always be cached.
  private POOL_ADDRESS_CACHE: { [key: string]: string } = {};

  /**
   * Creates an instance of V3PoolProvider.
   * @param chainId The chain id to use.
   * @param multicall2Provider The multicall provider to use to get the pools.
   * @param retryOptions The retry options for each call to the multicall.
   */
  constructor(
    protected chainId: ChainId,
    protected multicall2Provider: IMulticallProvider,
    protected retryOptions: V3PoolRetryOptions = {
      retries: 2,
      minTimeout: 50,
      maxTimeout: 500,
    }
  ) {}

  public async getPools(
    tokenPairs: [Token, Token, FeeAmount][],
    providerConfig?: ProviderConfig
  ): Promise<V3PoolAccessor> {
    const poolAddressSet: Set<string> = new Set<string>();
    const sortedTokenPairs: Array<[Token, Token, FeeAmount]> = [];
    const sortedPoolAddresses: string[] = [];

    for (const tokenPair of tokenPairs) {
      const [tokenA, tokenB, feeAmount] = tokenPair;

      const { poolAddress, token0, token1 } = this.getPoolAddress(
        tokenA,
        tokenB,
        feeAmount
      );

      if (poolAddressSet.has(poolAddress)) {
        continue;
      }

      poolAddressSet.add(poolAddress);
      sortedTokenPairs.push([token0, token1, feeAmount]);
      sortedPoolAddresses.push(poolAddress);
    }

    log.debug(
      `getPools called with ${tokenPairs.length} token pairs. Deduped down to ${poolAddressSet.size}`
    );

    const [slot0Results, liquidityResults] = await Promise.all([
      this.getPoolsData<ISlot0>(sortedPoolAddresses, 'slot0', providerConfig),
      this.getPoolsData<[ILiquidity]>(
        sortedPoolAddresses,
        'liquidity',
        providerConfig
      ),
    ]);

    log.info(
      `Got liquidity and slot0s for ${poolAddressSet.size} pools ${
        providerConfig?.blockNumber
          ? `as of block: ${providerConfig?.blockNumber}.`
          : ``
      }`
    );

    const poolAddressToPool: { [poolAddress: string]: Pool } = {};

    const invalidPools: [Token, Token, FeeAmount][] = [];

    for (let i = 0; i < sortedPoolAddresses.length; i++) {
      const slot0Result = slot0Results[i];
      const liquidityResult = liquidityResults[i];

      // These properties tell us if a pool is valid and initialized or not.
      if (
        !slot0Result?.success ||
        !liquidityResult?.success ||
        slot0Result.result.sqrtPriceX96.eq(0)
      ) {
        const [token0, token1, fee] = sortedTokenPairs[i]!;
        invalidPools.push([token0, token1, fee]);

        continue;
      }

      const [token0, token1, fee] = sortedTokenPairs[i]!;
      const slot0 = slot0Result.result;
      const liquidity = liquidityResult.result[0];

      const pool = new Pool(
        token0,
        token1,
        fee,
        slot0.sqrtPriceX96.toString(),
        liquidity.toString(),
        slot0.tick
      );

      const poolAddress = sortedPoolAddresses[i]!;

      poolAddressToPool[poolAddress] = pool;
    }

    if (invalidPools.length > 0) {
      log.info(
        {
          invalidPools: _.map(
            invalidPools,
            ([token0, token1, fee]) =>
              `${token0.symbol}/${token1.symbol}/${fee / 10000}%`
          ),
        },
        `${invalidPools.length} pools invalid after checking their slot0 and liquidity results. Dropping.`
      );
    }

    const poolStrs = _.map(Object.values(poolAddressToPool), poolToString);

    log.debug({ poolStrs }, `Found ${poolStrs.length} valid pools`);

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
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    const cacheKey = `${this.chainId}/${token0.address}/${token1.address}/${feeAmount}`;

    const cachedAddress = this.POOL_ADDRESS_CACHE[cacheKey];

    if (cachedAddress) {
      return { poolAddress: cachedAddress, token0, token1 };
    }

    const poolAddress = computePoolAddress({
      factoryAddress: V3_CORE_FACTORY_ADDRESSES[this.chainId]!,
      tokenA: token0,
      tokenB: token1,
      fee: feeAmount,
    });

    this.POOL_ADDRESS_CACHE[cacheKey] = poolAddress;

    return { poolAddress, token0, token1 };
  }

  private async getPoolsData<TReturn>(
    poolAddresses: string[],
    functionName: string,
    providerConfig?: ProviderConfig
  ): Promise<Result<TReturn>[]> {
    const { results, blockNumber } = await retry(async () => {
      return this.multicall2Provider.callSameFunctionOnMultipleContracts<
        undefined,
        TReturn
      >({
        addresses: poolAddresses,
        contractInterface: IUniswapV3PoolState__factory.createInterface(),
        functionName: functionName,
        providerConfig,
      });
    }, this.retryOptions);

    log.debug(`Pool data fetched as of block ${blockNumber}`);

    return results;
  }
}
