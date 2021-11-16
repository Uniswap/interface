import {
  AlphaRouterParams,
  CachingV3PoolProvider,
  ChainId,
  ID_TO_CHAIN_ID,
  IMetric,
  MetricLoggerUnit,
  setGlobalMetric,
  UniswapMulticallProvider,
  V2PoolProvider,
  V3PoolProvider,
} from '@uniswap/smart-order-router'
import { Pool } from '@uniswap/v3-sdk'
import { timing } from 'components/analytics'
import { NETWORK_URLS } from 'connectors/networkUrls'
import { providers } from 'ethers/lib/ethers'
import { MemoryCache } from 'utils/memoryCache'

import { SUPPORTED_CHAINS } from './constants'

export type Dependencies = {
  [chainId in ChainId]?: AlphaRouterParams & {
    v3PoolProvider: NonNullable<AlphaRouterParams['v3PoolProvider']>
    v2PoolProvider: NonNullable<AlphaRouterParams['v2PoolProvider']>
  }
}

/**
 * Minimal set of dependencies for the router to work locally.
 * Pool providers are currently only used when processing swap routes.
 */
export function buildDependencies(): Dependencies {
  const dependenciesByChain: Dependencies = {}
  for (const chainId of SUPPORTED_CHAINS) {
    const provider = new providers.JsonRpcProvider(NETWORK_URLS[chainId])

    const multicall2Provider = new UniswapMulticallProvider(chainId, provider, 375_000)

    dependenciesByChain[chainId] = {
      chainId,
      provider,
      v3PoolProvider: new CachingV3PoolProvider(
        chainId,
        new V3PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider),
        new MemoryCache<Pool>()
      ),
      v2PoolProvider: new V2PoolProvider(chainId, multicall2Provider),
    }
  }

  return dependenciesByChain
}

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
