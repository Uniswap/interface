import { Protocol } from '@teleswap/router-sdk'
import { AlphaRouter, ChainId, V2SubgraphProvider } from '@teleswap/smart-order-router'
import { RPC_PROVIDERS } from 'constants/providers'
import { getClientSideQuote, QuoteArguments, toSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'

import { GetQuoteResult } from './types'

const routers = new Map<ChainId, AlphaRouter>()
function getRouter(chainId: ChainId): AlphaRouter {
  const router = routers.get(chainId)
  if (router) return router

  const supportedChainId = toSupportedChainId(chainId)
  if (supportedChainId) {
    const provider = RPC_PROVIDERS[supportedChainId]
    const router = new AlphaRouter({
      chainId,
      provider,
      v2SubgraphProvider: new V2SubgraphProvider(chainId)
    })
    routers.set(chainId, router)
    return router
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

const CLIENT_PARAMS = {
  protocols: [Protocol.V2]
}

export async function route(req: QuoteArguments): Promise<{ data: GetQuoteResult; error?: unknown }> {
  const router = getRouter(req.tokenInChainId)
  const result = await getClientSideQuote(req, router, CLIENT_PARAMS)
  return result
}
