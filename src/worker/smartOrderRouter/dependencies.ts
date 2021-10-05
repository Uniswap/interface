import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import {
  AlphaRouterConfig,
  AlphaRouterParams,
  CachingGasStationProvider,
  CachingTokenListProvider,
  CachingTokenProviderWithFallback,
  ChainId,
  EIP1559GasPriceProvider,
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
import { timing } from 'components/analytics'
import { NETWORK_URLS } from 'connectors/constants'
import { ethers } from 'ethers'


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

class MetricLogger extends IMetric {
  putDimensions() {
    return
  }

  putMetric(key: string, value: number, unit?: MetricLoggerUnit) {
    timing({
      category: 'Routing API',
      variable: `${key} | ${unit}`,
      value,
      label: 'client'
    })
  }
}
setGlobalMetric(new MetricLogger())

class Cache<T> implements ICache<T> {
  async get() {
    return undefined
  }
  async set() {
    return false
  }
  async has() {
    return false
  }
}

export type Dependencies = { [chainId in ChainId]?: AlphaRouterParams }

export function buildDependencies(): Dependencies {
  const dependenciesByChain: Dependencies = {}
  for (const chainId of SUPPORTED_CHAINS) {
    const provider = new ethers.providers.JsonRpcProvider(NETWORK_URLS[chainId])

    //todo: use fallback
    const tokenListProvider = new CachingTokenListProvider(chainId, DEFAULT_TOKEN_LIST, new Cache())

    const tokenCache = new Cache()
    const blockedTokenCache = new Cache()

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
      // tokenListProvider,
      blockedTokenListProvider: undefined,
      multicall2Provider,
      poolProvider: new PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider),
      tokenProvider,
      subgraphProvider: new URISubgraphProvider(
        chainId,
        'https://ipfs.io/ipfs/QmfArMYESGVJpPALh4eQXnjF8HProSF1ky3v8RmuYLJZT4'
      ),
      // tokenProviderFromTokenList: tokenListProvider,
      quoteProvider,
      gasPriceProvider: new CachingGasStationProvider(chainId, new EIP1559GasPriceProvider(provider), new Cache()),
      gasModelFactory: new HeuristicGasModelFactory(),
    }
  }

  return dependenciesByChain
}
