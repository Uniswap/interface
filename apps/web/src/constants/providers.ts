import { tryProvideSession } from '@universe/api'
import { providers as ethersProviders } from 'ethers/lib/ethers'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId, RPCType } from 'uniswap/src/features/chains/types'
import { createEthersProviderFactory } from 'uniswap/src/features/providers/createEthersProvider'
import { defaultResolveRpcConfig } from 'uniswap/src/features/providers/resolveRpcConfig'
import AppJsonRpcProvider from '~/rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from '~/rpc/ConfiguredJsonRpcProvider'

const createProvider = createEthersProviderFactory({
  resolveRpcConfig: defaultResolveRpcConfig,
  getSessionGate: tryProvideSession,
})

/**
 * Per-chain interface RPC provider. Routes through UniRPC when the gate is on
 * (single instrumented provider, server-side failover), and through
 * `AppJsonRpcProvider` over the chain's interface URLs when off (multi-URL
 * client-side fallback, preserving prior behavior). Both paths emit observer
 * events so chain-RPC telemetry is uniform regardless of routing.
 *
 * Construction is lazy (deferred to the first `getRpcProvider` call) so the
 * `getFeatureFlag(UniRpcEnabled)` call inside `defaultResolveRpcConfig` does
 * not run at module load. Eager evaluation reaches Statsig before
 * `<StatsigProviderWrapper>` mounts and triggers `StatsigClient.instance(key)`
 * to create a no-options client; the React provider's `useClientAsyncInit`
 * then reuses that broken instance and silently drops `networkConfig.api`,
 * `overrideAdapter`, and `environment.tier`. If that first call still beats
 * Statsig init the chain resolves to legacy — so the cache rebuilds once on the
 * legacy→UniRPC transition (see `getRpcProvider`) rather than pinning the chain
 * to legacy for the whole session. ViemClientManager solves the same staleness
 * by re-resolving per call; ethers providers are stateful (polling/listeners),
 * so we rebuild-on-transition instead.
 */
interface CachedProvider {
  provider: ethersProviders.JsonRpcProvider
  /** Whether `provider` is the UniRPC provider (vs the legacy multi-URL fallback). */
  isUniRpc: boolean
}

function buildAppProvider(chainId: EVMUniverseChainId): CachedProvider {
  // Prefer UniRPC routing; fall through to the legacy multi-URL provider on
  // either branch — UniRPC inactive OR factory construction returned null
  // (createEthersProviderFactory swallows internal exceptions and returns
  // null on failure). Without this fallback, a single resolver hiccup at
  // first-call would throw and take down provider resolution for that chain.
  const rpcConfig = defaultResolveRpcConfig({ chainId, rpcType: RPCType.Public })
  if (rpcConfig?.isUniRpc) {
    const provider = createProvider({ chainId, rpcType: RPCType.Public })
    if (provider) {
      return { provider, isUniRpc: true }
    }
  }

  const info = getChainInfo(chainId)
  return {
    provider: new AppJsonRpcProvider(
      info.rpcUrls.interface.http.map(
        (url) => new ConfiguredJsonRpcProvider({ url, networkish: { chainId, name: info.interfaceName } }),
      ),
    ),
    isUniRpc: false,
  }
}

const providerCache = new Map<EVMUniverseChainId, CachedProvider>()

/**
 * Returns the singleton interface RPC provider for `chainId`. Use this
 * everywhere instead of building providers ad-hoc — it's the only entry point
 * that respects the UniRPC gate.
 *
 * Constructs on first call, then caches. The one exception: if the cached
 * provider is the legacy fallback (built before the UniRPC gate resolved) and
 * the gate has since turned on, it rebuilds once onto UniRPC and sticks — so a
 * first call that beat Statsig init doesn't pin the chain to legacy for the
 * session.
 */
export function getRpcProvider(chainId: EVMUniverseChainId): ethersProviders.JsonRpcProvider {
  const cached = providerCache.get(chainId)
  if (cached) {
    // Already on UniRPC, or still legacy and the gate is still off → reuse.
    if (cached.isUniRpc || !defaultResolveRpcConfig({ chainId, rpcType: RPCType.Public })?.isUniRpc) {
      return cached.provider
    }
  }
  const built = buildAppProvider(chainId)
  providerCache.set(chainId, built)
  return built.provider
}

export function getInterfaceProvider(
  chainId: EVMUniverseChainId | undefined,
): ethersProviders.JsonRpcProvider | undefined {
  return chainId ? getRpcProvider(chainId) : undefined
}
