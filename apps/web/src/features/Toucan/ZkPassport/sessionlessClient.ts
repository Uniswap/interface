import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { createPublicClient, fallback, http, PublicClient } from 'viem'

const clients = new Map<UniverseChainId, PublicClient>()

/**
 * Public client over the chain's open RPC endpoints, bypassing the app's
 * UniRPC transport. UniRPC (`/entry-gateway/rpc/<chainId>`) rejects every
 * request with a 401 until the gateway session is established, and a viewer
 * without one (fresh profile, failed Turnstile challenge on a third-party
 * domain) never gets it — while the auction page still renders because its
 * data rides sessionless connect endpoints. The ZKPassport gate must resolve
 * for exactly those viewers, so its handful of reads use the chain's
 * Default/Fallback URLs, which require neither a session nor an API key.
 */
export function getSessionlessPublicClient(chainId: UniverseChainId): PublicClient {
  const cached = clients.get(chainId)
  if (cached) {
    return cached
  }
  const { rpcUrls } = getChainInfo(chainId)
  const urls = [...(rpcUrls[RPCType.Default]?.http ?? []), ...(rpcUrls[RPCType.Fallback]?.http ?? [])]
  const client = createPublicClient({
    transport: fallback(urls.map((url) => http(url))),
  })
  clients.set(chainId, client)
  return client
}
