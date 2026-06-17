import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Private/unlaunched chains whose only RPC access path is authenticated UniRPC —
 * access is gated at the entry gateway and there is no public fallback endpoint.
 *
 * These bypass the UniRpcEnabled feature flag (see the resolver wiring in
 * resolveRpcConfig.web.ts / .native.ts): when the flag is off the resolver would
 * otherwise fall back to the legacy chain-info URL, which for these chains points
 * at the gateway *without* session auth (no cookie on web; no X-Session-ID /
 * X-Device-ID headers on extension/native) and is rejected with a 401.
 *
 * Removable once these chains launch and have public RPC endpoints.
 */
const UNIRPC_ONLY_CHAINS: ReadonlySet<UniverseChainId> = new Set([UniverseChainId.Arc, UniverseChainId.Robinhood])

export function isUniRpcOnlyChain(chainId: UniverseChainId): boolean {
  return UNIRPC_ONLY_CHAINS.has(chainId)
}
