import { providers as ethersProviders } from 'ethers/lib/ethers'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId, RPCType } from 'uniswap/src/features/chains/types'
import { createEthersProviderFactory } from 'uniswap/src/features/providers/createEthersProvider'
import { defaultResolveRpcConfig } from 'uniswap/src/features/providers/resolveRpcConfig'
import AppJsonRpcProvider from '~/rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from '~/rpc/ConfiguredJsonRpcProvider'

const createProvider = createEthersProviderFactory({ resolveRpcConfig: defaultResolveRpcConfig })

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
 * `overrideAdapter`, and `environment.tier`. The cache below preserves the
 * "captured at first call, not rebuilt mid-session" semantics.
 */
function buildAppProvider(chainId: EVMUniverseChainId): ethersProviders.JsonRpcProvider {
  // Prefer UniRPC routing; fall through to the legacy multi-URL provider on
  // either branch — UniRPC inactive OR factory construction returned null
  // (createEthersProviderFactory swallows internal exceptions and returns
  // null on failure). Without this fallback, a single resolver hiccup at
  // first-call would throw and take down provider resolution for that chain.
  const rpcConfig = defaultResolveRpcConfig({ chainId, rpcType: RPCType.Public })
  if (rpcConfig?.isUniRpc) {
    const provider = createProvider({ chainId, rpcType: RPCType.Public })
    if (provider) {
      return provider
    }
  }

  const info = getChainInfo(chainId)
  return new AppJsonRpcProvider(
    info.rpcUrls.interface.http.map(
      (url) => new ConfiguredJsonRpcProvider({ url, networkish: { chainId, name: info.interfaceName } }),
    ),
  )
}

const providerCache = new Map<EVMUniverseChainId, ethersProviders.JsonRpcProvider>()

/**
 * Returns the singleton interface RPC provider for `chainId`. Constructs on
 * first call, then caches. Use this everywhere instead of building providers
 * ad-hoc — it's the only entry point that respects the UniRPC gate.
 */
export function getRpcProvider(chainId: EVMUniverseChainId): ethersProviders.JsonRpcProvider {
  let provider = providerCache.get(chainId)
  if (!provider) {
    provider = buildAppProvider(chainId)
    providerCache.set(chainId, provider)
  }
  return provider
}

export function getInterfaceProvider(
  chainId: EVMUniverseChainId | undefined,
): ethersProviders.JsonRpcProvider | undefined {
  return chainId ? getRpcProvider(chainId) : undefined
}
