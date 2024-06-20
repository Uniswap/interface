import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Token } from '@ubeswap/sdk-core'

import { log, metric, MetricLoggerUnit } from '../util'

import { ICache } from './cache'
import { ProviderConfig } from './provider'
import { DEFAULT_TOKEN_FEE_RESULT, ITokenFeeFetcher, TokenFeeMap, TokenFeeResult } from './token-fee-fetcher'
import { DEFAULT_ALLOWLIST, TokenValidationResult } from './token-validator-provider'

export const DEFAULT_TOKEN_PROPERTIES_RESULT: TokenPropertiesResult = {
  tokenFeeResult: DEFAULT_TOKEN_FEE_RESULT,
}
export const POSITIVE_CACHE_ENTRY_TTL = 600 // 10 minutes in seconds
export const NEGATIVE_CACHE_ENTRY_TTL = 600 // 10 minutes in seconds

type Address = string
export type TokenPropertiesResult = {
  tokenFeeResult?: TokenFeeResult
  tokenValidationResult?: TokenValidationResult
}
export type TokenPropertiesMap = Record<Address, TokenPropertiesResult>

export interface ITokenPropertiesProvider {
  getTokensProperties(tokens: Token[], providerConfig?: ProviderConfig): Promise<TokenPropertiesMap>
}

export class TokenPropertiesProvider implements ITokenPropertiesProvider {
  private CACHE_KEY = (chainId: ChainId, address: string) => `token-properties-${chainId}-${address}`

  constructor(
    private chainId: ChainId,
    private tokenPropertiesCache: ICache<TokenPropertiesResult>,
    private tokenFeeFetcher: ITokenFeeFetcher,
    private allowList = DEFAULT_ALLOWLIST,
    private positiveCacheEntryTTL = POSITIVE_CACHE_ENTRY_TTL,
    private negativeCacheEntryTTL = NEGATIVE_CACHE_ENTRY_TTL
  ) {}

  public async getTokensProperties(tokens: Token[], providerConfig?: ProviderConfig): Promise<TokenPropertiesMap> {
    const tokenToResult: TokenPropertiesMap = {}

    if (!providerConfig?.enableFeeOnTransferFeeFetching || this.chainId !== ChainId.MAINNET) {
      return tokenToResult
    }

    const addressesToFetchFeesOnchain: string[] = []
    const addressesRaw = this.buildAddressesRaw(tokens)

    const tokenProperties = await this.tokenPropertiesCache.batchGet(addressesRaw)

    // Check if we have cached token validation results for any tokens.
    for (const address of addressesRaw) {
      const cachedValue = tokenProperties[address]
      if (cachedValue) {
        metric.putMetric('TokenPropertiesProviderBatchGetCacheHit', 1, MetricLoggerUnit.Count)
        const tokenFee = cachedValue.tokenFeeResult
        const tokenFeeResultExists: BigNumber | undefined = tokenFee && (tokenFee.buyFeeBps || tokenFee.sellFeeBps)

        if (tokenFeeResultExists) {
          metric.putMetric(
            `TokenPropertiesProviderCacheHitTokenFeeResultExists${tokenFeeResultExists}`,
            1,
            MetricLoggerUnit.Count
          )
        } else {
          metric.putMetric(`TokenPropertiesProviderCacheHitTokenFeeResultNotExists`, 1, MetricLoggerUnit.Count)
        }

        tokenToResult[address] = cachedValue
      } else if (this.allowList.has(address)) {
        tokenToResult[address] = {
          tokenValidationResult: TokenValidationResult.UNKN,
        }
      } else {
        addressesToFetchFeesOnchain.push(address)
      }
    }

    if (addressesToFetchFeesOnchain.length > 0) {
      let tokenFeeMap: TokenFeeMap = {}

      try {
        tokenFeeMap = await this.tokenFeeFetcher.fetchFees(addressesToFetchFeesOnchain, providerConfig)
      } catch (err) {
        log.error({ err }, `Error fetching fees for tokens ${addressesToFetchFeesOnchain}`)
      }

      await Promise.all(
        addressesToFetchFeesOnchain.map((address) => {
          const tokenFee = tokenFeeMap[address]
          const tokenFeeResultExists: BigNumber | undefined = tokenFee && (tokenFee.buyFeeBps || tokenFee.sellFeeBps)

          if (tokenFeeResultExists) {
            // we will leverage the metric to log the token fee result, if it exists
            // the idea is that the token fee should not differ by too much across tokens,
            // so that we can accurately log the token fee for a particular quote request (without breaching metrics dimensionality limit)
            // in the form of metrics.
            // if we log as logging, given prod traffic volume, the logging volume will be high.
            metric.putMetric(
              `TokenPropertiesProviderTokenFeeResultCacheMissExists${tokenFeeResultExists}`,
              1,
              MetricLoggerUnit.Count
            )

            const tokenPropertiesResult = {
              tokenFeeResult: tokenFee,
              tokenValidationResult: TokenValidationResult.FOT,
            }
            tokenToResult[address] = tokenPropertiesResult

            metric.putMetric('TokenPropertiesProviderBatchGetCacheMiss', 1, MetricLoggerUnit.Count)

            // update cache concurrently
            // at this point, we are confident that the tokens are FOT, so we can hardcode the validation result
            return this.tokenPropertiesCache.set(
              this.CACHE_KEY(this.chainId, address),
              tokenPropertiesResult,
              this.positiveCacheEntryTTL
            )
          } else {
            metric.putMetric(`TokenPropertiesProviderTokenFeeResultCacheMissNotExists`, 1, MetricLoggerUnit.Count)

            const tokenPropertiesResult = {
              tokenFeeResult: undefined,
              tokenValidationResult: undefined,
            }
            tokenToResult[address] = tokenPropertiesResult

            return this.tokenPropertiesCache.set(
              this.CACHE_KEY(this.chainId, address),
              tokenPropertiesResult,
              this.negativeCacheEntryTTL
            )
          }
        })
      )
    }

    return tokenToResult
  }

  private buildAddressesRaw(tokens: Token[]): Set<string> {
    const addressesRaw = new Set<string>()

    for (const token of tokens) {
      const address = token.address.toLowerCase()
      if (!addressesRaw.has(address)) {
        addressesRaw.add(address)
      }
    }

    return addressesRaw
  }
}
