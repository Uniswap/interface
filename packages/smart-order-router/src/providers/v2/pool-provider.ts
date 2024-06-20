import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import retry, { Options as RetryOptions } from 'async-retry'
import _ from 'lodash'

import { IUniswapV2Pair__factory } from '../../types/v2/factories/IUniswapV2Pair__factory'
import { CurrencyAmount, ID_TO_NETWORK_NAME, metric, MetricLoggerUnit } from '../../util'
import { log } from '../../util/log'
import { poolToString } from '../../util/routes'
import { IMulticallProvider, Result } from '../multicall-provider'
import { ProviderConfig } from '../provider'
import { ITokenPropertiesProvider } from '../token-properties-provider'
import { TokenValidationResult } from '../token-validator-provider'

type IReserves = {
  reserve0: BigNumber
  reserve1: BigNumber
  blockTimestampLast: number
}

/**
 * Provider for getting V2 pools.
 *
 * @export
 * @interface IV2PoolProvider
 */
export interface IV2PoolProvider {
  /**
   * Gets the pools for the specified token pairs.
   *
   * @param tokenPairs The token pairs to get.
   * @param [providerConfig] The provider config.
   * @returns A pool accessor with methods for accessing the pools.
   */
  getPools(tokenPairs: [Token, Token][], providerConfig?: ProviderConfig): Promise<V2PoolAccessor>

  /**
   * Gets the pool address for the specified token pair.
   *
   * @param tokenA Token A in the pool.
   * @param tokenB Token B in the pool.
   * @returns The pool address and the two tokens.
   */
  getPoolAddress(tokenA: Token, tokenB: Token): { poolAddress: string; token0: Token; token1: Token }
}

export type V2PoolAccessor = {
  getPool: (tokenA: Token, tokenB: Token) => Pair | undefined
  getPoolByAddress: (address: string) => Pair | undefined
  getAllPools: () => Pair[]
}

export type V2PoolRetryOptions = RetryOptions

export class V2PoolProvider implements IV2PoolProvider {
  // Computing pool addresses is slow as it requires hashing, encoding etc.
  // Addresses never change so can always be cached.
  private POOL_ADDRESS_CACHE: { [key: string]: string } = {}

  /**
   * Creates an instance of V2PoolProvider.
   * @param chainId The chain id to use.
   * @param multicall2Provider The multicall provider to use to get the pools.
   * @param tokenPropertiesProvider The token properties provider to use to get token properties.
   * @param retryOptions The retry options for each call to the multicall.
   */
  constructor(
    protected chainId: ChainId,
    protected multicall2Provider: IMulticallProvider,
    protected tokenPropertiesProvider: ITokenPropertiesProvider,
    protected retryOptions: V2PoolRetryOptions = {
      retries: 2,
      minTimeout: 50,
      maxTimeout: 500,
    }
  ) {}

  public async getPools(tokenPairs: [Token, Token][], providerConfig?: ProviderConfig): Promise<V2PoolAccessor> {
    const poolAddressSet: Set<string> = new Set<string>()
    const sortedTokenPairs: Array<[Token, Token]> = []
    const sortedPoolAddresses: string[] = []

    for (const tokenPair of tokenPairs) {
      const [tokenA, tokenB] = tokenPair

      const { poolAddress, token0, token1 } = this.getPoolAddress(tokenA, tokenB)

      if (poolAddressSet.has(poolAddress)) {
        continue
      }

      poolAddressSet.add(poolAddress)
      sortedTokenPairs.push([token0, token1])
      sortedPoolAddresses.push(poolAddress)
    }

    log.debug(`getPools called with ${tokenPairs.length} token pairs. Deduped down to ${poolAddressSet.size}`)

    metric.putMetric('V2_RPC_POOL_RPC_CALL', 1, MetricLoggerUnit.None)
    metric.putMetric('V2GetReservesBatchSize', sortedPoolAddresses.length, MetricLoggerUnit.Count)
    metric.putMetric(
      `V2GetReservesBatchSize_${ID_TO_NETWORK_NAME(this.chainId)}`,
      sortedPoolAddresses.length,
      MetricLoggerUnit.Count
    )

    const [reservesResults, tokenPropertiesMap] = await Promise.all([
      this.getPoolsData<IReserves>(sortedPoolAddresses, 'getReserves', providerConfig),
      this.tokenPropertiesProvider.getTokensProperties(this.flatten(tokenPairs), providerConfig),
    ])

    log.info(
      `Got reserves for ${poolAddressSet.size} pools ${
        providerConfig?.blockNumber ? `as of block: ${await providerConfig?.blockNumber}.` : ``
      }`
    )

    const poolAddressToPool: { [poolAddress: string]: Pair } = {}

    const invalidPools: [Token, Token][] = []

    for (let i = 0; i < sortedPoolAddresses.length; i++) {
      const reservesResult = reservesResults[i]!

      if (!reservesResult?.success) {
        const [token0, token1] = sortedTokenPairs[i]!
        invalidPools.push([token0, token1])

        continue
      }

      let [token0, token1] = sortedTokenPairs[i]!
      if (tokenPropertiesMap[token0.address.toLowerCase()]?.tokenValidationResult === TokenValidationResult.FOT) {
        token0 = new Token(
          token0.chainId,
          token0.address,
          token0.decimals,
          token0.symbol,
          token0.name,
          true, // at this point we know it's valid token address
          tokenPropertiesMap[token0.address.toLowerCase()]?.tokenFeeResult?.buyFeeBps,
          tokenPropertiesMap[token0.address.toLowerCase()]?.tokenFeeResult?.sellFeeBps
        )
      }

      if (tokenPropertiesMap[token1.address.toLowerCase()]?.tokenValidationResult === TokenValidationResult.FOT) {
        token1 = new Token(
          token1.chainId,
          token1.address,
          token1.decimals,
          token1.symbol,
          token1.name,
          true, // at this point we know it's valid token address
          tokenPropertiesMap[token1.address.toLowerCase()]?.tokenFeeResult?.buyFeeBps,
          tokenPropertiesMap[token1.address.toLowerCase()]?.tokenFeeResult?.sellFeeBps
        )
      }

      const { reserve0, reserve1 } = reservesResult.result

      const pool = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
      )

      const poolAddress = sortedPoolAddresses[i]!

      poolAddressToPool[poolAddress] = pool
    }

    if (invalidPools.length > 0) {
      log.info(
        {
          invalidPools: _.map(invalidPools, ([token0, token1]) => `${token0.symbol}/${token1.symbol}`),
        },
        `${invalidPools.length} pools invalid after checking their slot0 and liquidity results. Dropping.`
      )
    }

    const poolStrs = _.map(Object.values(poolAddressToPool), poolToString)

    log.debug({ poolStrs }, `Found ${poolStrs.length} valid pools`)

    return {
      getPool: (tokenA: Token, tokenB: Token): Pair | undefined => {
        const { poolAddress } = this.getPoolAddress(tokenA, tokenB)
        return poolAddressToPool[poolAddress]
      },
      getPoolByAddress: (address: string): Pair | undefined => poolAddressToPool[address],
      getAllPools: (): Pair[] => Object.values(poolAddressToPool),
    }
  }

  public getPoolAddress(tokenA: Token, tokenB: Token): { poolAddress: string; token0: Token; token1: Token } {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

    const cacheKey = `${this.chainId}/${token0.address}/${token1.address}`

    const cachedAddress = this.POOL_ADDRESS_CACHE[cacheKey]

    if (cachedAddress) {
      return { poolAddress: cachedAddress, token0, token1 }
    }

    const poolAddress = Pair.getAddress(token0, token1)

    this.POOL_ADDRESS_CACHE[cacheKey] = poolAddress

    return { poolAddress, token0, token1 }
  }

  private async getPoolsData<TReturn>(
    poolAddresses: string[],
    functionName: string,
    providerConfig?: ProviderConfig
  ): Promise<Result<TReturn>[]> {
    const { results, blockNumber } = await retry(async () => {
      return this.multicall2Provider.callSameFunctionOnMultipleContracts<undefined, TReturn>({
        addresses: poolAddresses,
        contractInterface: IUniswapV2Pair__factory.createInterface(),
        functionName,
        providerConfig,
      })
    }, this.retryOptions)

    log.debug(`Pool data fetched as of block ${blockNumber}`)

    return results
  }

  // We are using ES2017. ES2019 has native flatMap support
  private flatten(tokenPairs: Array<[Token, Token]>): Token[] {
    const tokens = new Array<Token>()

    for (const [tokenA, tokenB] of tokenPairs) {
      tokens.push(tokenA)
      tokens.push(tokenB)
    }

    return tokens
  }
}
