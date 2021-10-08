import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { Token } from '@uniswap/sdk-core'
import {
  AlphaRouterConfig,
  AlphaRouterParams,
  CachingGasStationProvider,
  CachingPoolProvider,
  CachingTokenListProvider,
  CachingTokenProviderWithFallback,
  ChainId,
  EIP1559GasPriceProvider,
  GasPrice,
  HeuristicGasModelFactory,
  ICache,
  ID_TO_CHAIN_ID,
  IMetric,
  MetricLoggerUnit,
  PoolProvider,
  QuoteProvider,
  setGlobalMetric,
  TokenProvider,
  UniswapMulticallProvider,
  URISubgraphProvider,
} from '@uniswap/smart-order-router'
import { TokenList } from '@uniswap/token-lists'
import { Pool } from '@uniswap/v3-sdk'
import { timing } from 'components/analytics'
import { NETWORK_URLS } from 'connectors/networkUrls'
import { providers } from 'ethers/lib/ethers'
import ms from 'ms.macro'

import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/unsupported.tokenlist.json'

export const DEFAULT_ROUTING_CONFIG: AlphaRouterConfig = {
  topN: 2,
  topNDirectSwaps: 2,
  topNTokenInOut: 3,
  topNSecondHop: 0,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 6,
  topNWithBaseTokenInSet: false,
  maxSwapsPerPath: 3,
  minSplits: 1,
  maxSplits: 7,
  distributionPercent: 5,
}

const SUPPORTED_CHAINS: ChainId[] = [ChainId.MAINNET, ChainId.RINKEBY]

class GAMetric extends IMetric {
  putDimensions() {
    return
  }

  putMetric(key: string, value: number, unit?: MetricLoggerUnit) {
    timing({
      category: 'Routing API',
      variable: `${key} | ${unit}`,
      value,
      label: 'client',
    })
  }
}
setGlobalMetric(new GAMetric())

//TODO(judo): move to utils and add tests
class MemoryCache<T> implements ICache<T> {
  private cache: Record<string, { val: T; added: number; timeout?: ReturnType<typeof setTimeout> }> = {}

  constructor(private ttl?: number) {}

  async get(key: string) {
    const rec = this.cache[key]

    if (this.ttl) {
      return !(rec?.added && rec?.added + this.ttl > Date.now()) ? rec?.val : undefined
    } else {
      return rec?.val
    }
  }

  async set(key: string, value: T) {
    this.cache[key] = {
      val: value,
      added: Date.now(),
      timeout: this.ttl ? setTimeout(() => this.del(key), this.ttl) : undefined,
    }

    return true
  }

  async has(key: string) {
    return Boolean(this.cache[key])
  }

  del(key: string) {
    const rec = this.cache[key]

    if (!rec) return
    if (rec.timeout) clearTimeout(rec.timeout)

    delete this.cache[key]
  }
}

export type Dependencies = { [chainId in ChainId]?: AlphaRouterParams }

// loosely inspired by https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/injector.ts#L204-L286
export function buildDependencies(): Dependencies {
  const dependenciesByChain: Dependencies = {}
  for (const chainId of SUPPORTED_CHAINS) {
    const provider = new providers.JsonRpcProvider(NETWORK_URLS[chainId])

    const tokenListProvider = new CachingTokenListProvider(chainId, DEFAULT_TOKEN_LIST, new MemoryCache<Token>())

    const tokenCache = new MemoryCache<Token>()
    const blockedTokenCache = new MemoryCache<Token>()

    const multicall2Provider = new UniswapMulticallProvider(chainId, provider, 375_000)
    const tokenProvider = new CachingTokenProviderWithFallback(
      chainId,
      tokenCache,
      tokenListProvider,
      new TokenProvider(chainId, multicall2Provider)
    )

    // Some providers like Infura set a gas limit per call of 10x block gas which is approx 150m
    // 200*725k < 150m
    const quoteProvider = new QuoteProvider(
      chainId,
      provider,
      multicall2Provider,
      {
        retries: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      },
      {
        multicallChunk: 210, // 210
        gasLimitPerCall: 705_000, // 705
        quoteMinSuccessRate: 0.15,
      },
      {
        gasLimitOverride: 2_000_000,
        multicallChunk: 70,
      }
    )

    dependenciesByChain[chainId] = {
      chainId,
      provider,
      blockedTokenListProvider: new CachingTokenListProvider(
        chainId,
        UNSUPPORTED_TOKEN_LIST as TokenList,
        blockedTokenCache
      ),
      multicall2Provider,
      poolProvider: new CachingPoolProvider(
        chainId,
        new PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider),
        new MemoryCache<Pool>()
      ),
      tokenProvider,
      subgraphProvider: new URISubgraphProvider(
        chainId,
        'https://ipfs.io/ipfs/QmfArMYESGVJpPALh4eQXnjF8HProSF1ky3v8RmuYLJZT4'
      ),
      quoteProvider,
      gasPriceProvider: new CachingGasStationProvider(
        chainId,
        new EIP1559GasPriceProvider(provider),
        new MemoryCache<GasPrice>(ms`15s`)
      ),
      gasModelFactory: new HeuristicGasModelFactory(),
    }
  }

  return dependenciesByChain
}
