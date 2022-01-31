import { AlphaRouterParams } from '@uniswap/smart-order-router'
import { INFURA_NETWORK_URLS } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { providers } from 'ethers/lib/ethers'

import { AUTO_ROUTER_SUPPORTED_CHAINS } from './constants'

export type Dependencies = {
  [chainId in SupportedChainId]?: AlphaRouterParams
}

/** Minimal set of dependencies for the router to work locally. */
export function buildDependencies(): Dependencies {
  const dependenciesByChain: Dependencies = {}
  for (const chainId of AUTO_ROUTER_SUPPORTED_CHAINS) {
    const provider = new providers.JsonRpcProvider(INFURA_NETWORK_URLS[chainId])

    dependenciesByChain[chainId] = {
      chainId,
      provider,
    }
  }

  return dependenciesByChain
}
