import { getEntryGatewayUrl, provideDeviceIdService, provideSessionStorage } from '@universe/api'
import { createRpcConfigResolver, createUniRpcConfigResolver } from '@universe/chains'
import { isE2eTestEnv, isExtensionApp, REQUEST_SOURCE } from '@universe/environment'
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
 * This file ships to both the web app (Vite) and the browser extension (WXT).
 * The two diverge in session strategy:
 *   - Web app: cookie-based — UniRPC reuses the browser's session cookie via
 *     `credentials: 'include'`, so no per-request header construction is needed.
 *   - Extension: header-based — extensions can't share the web app's cookie jar,
 *     so each request resolves a session/device header pair.
 *
 * Mobile uses the `.native.ts` sibling.
 */
const SHARED_UNI_RPC_CONFIG = {
  // UniRPC-only chains (Arc/Robinhood) always route through UniRPC; everything
  // else is flag-gated. Saga init runs before the Statsig provider mounts; guard
  // so the flag read doesn't trigger StatsigClient.instance()'s broken-fallback
  // branch.
  getFeatureFlag: (chainId: UniverseChainId) =>
    isUniRpcOnlyChain(chainId) || (isStatsigClientRegistered() && getFeatureFlag(FeatureFlags.UniRpcEnabled)),
  getEntryGatewayUrl,
  requestSource: REQUEST_SOURCE,
} as const

const webResolveUniRpcConfig = createUniRpcConfigResolver({
  ...SHARED_UNI_RPC_CONFIG,
  // Web app always routes through UniRPC; extension stays gated above.
  // Playwright e2e runs are the exception: UniRPC requires a session the test
  // environment can't establish (every /rpc/* call 401s), so let the resolver
  // fall through to the legacy chain-info URLs, which point at local anvil in e2e.
  // UniRPC-only chains intentionally follow this too — e2e has no gateway session
  // for them either — so this overrides the shared chain-aware getter.
  getFeatureFlag: () => !isE2eTestEnv(),
  credentials: 'include',
})

const extensionResolveUniRpcConfig = createUniRpcConfigResolver({
  ...SHARED_UNI_RPC_CONFIG,
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
})

export const defaultResolveRpcConfig = createRpcConfigResolver({
  resolveUniRpcConfig: isExtensionApp ? extensionResolveUniRpcConfig : webResolveUniRpcConfig,
  selectLegacyRpcUrl: selectRpcUrl,
})
