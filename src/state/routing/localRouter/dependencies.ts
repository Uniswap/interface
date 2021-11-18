import { AlphaRouterParams, ChainId, IMetric, MetricLoggerUnit, setGlobalMetric } from '@uniswap/smart-order-router'
import { timing } from 'components/analytics'
import { NETWORK_URLS } from 'connectors/networkUrls'
import { providers } from 'ethers/lib/ethers'

import { SUPPORTED_CHAINS } from './constants'

export type Dependencies = {
  [chainId in ChainId]?: AlphaRouterParams
}

/**
 * Minimal set of dependencies for the router to work locally.
 * Pool providers are currently only used when processing swap routes.
 */
export function buildDependencies(): Dependencies {
  const dependenciesByChain: Dependencies = {}
  for (const chainId of SUPPORTED_CHAINS) {
    const provider = new providers.JsonRpcProvider(NETWORK_URLS[chainId])

    dependenciesByChain[chainId] = {
      chainId,
      provider,
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
