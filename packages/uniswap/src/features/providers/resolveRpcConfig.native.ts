import { getEntryGatewayUrl, provideDeviceIdService, provideSessionStorage } from '@universe/api'
import { createRpcConfigResolver, createUniRpcConfigResolver } from '@universe/chains'
import { REQUEST_SOURCE } from '@universe/environment'
import { FeatureFlags, getFeatureFlag, isStatsigClientRegistered } from '@universe/gating'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'
import { isUniRpcOnlyChain } from 'uniswap/src/features/providers/unirpcOnlyChains'

export { createRpcConfigResolver } from '@universe/chains'
export type { RpcConfigResolver, RpcConfigResolverInput } from '@universe/chains'

/**
 * Convenience resolver for call sites that can't receive deps via injection.
 * Prefer ProviderManager for provider access — this exists for the edge cases.
 *
 * Native (iOS / Android) uses header-based session auth — there's no cookie jar
 * to share with a web origin, so each request resolves a session/device header
 * pair from the platform storage.
 */
export const defaultResolveRpcConfig = createRpcConfigResolver({
  resolveUniRpcConfig: createUniRpcConfigResolver({
    // UniRPC-only chains (Arc/Robinhood) always route through UniRPC; everything
    // else is flag-gated. Saga init runs before the Statsig provider mounts; guard
    // so the flag read doesn't trigger StatsigClient.instance()'s broken-fallback
    // branch.
    getFeatureFlag: (chainId: UniverseChainId) =>
      isUniRpcOnlyChain(chainId) || (isStatsigClientRegistered() && getFeatureFlag(FeatureFlags.UniRpcEnabled)),
    getEntryGatewayUrl,
    requestSource: REQUEST_SOURCE,
    getRequestHeaders: async () => {
      const [session, deviceId] = await Promise.all([
        provideSessionStorage().get(),
        provideDeviceIdService().getDeviceId(),
      ])
      return {
        ...(session?.sessionId && { 'X-Session-ID': session.sessionId }),
        ...(deviceId && { 'X-Device-ID': deviceId }),
      }
    },
  }),
  selectLegacyRpcUrl: selectRpcUrl,
})
