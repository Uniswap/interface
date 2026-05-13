import { getEntryGatewayUrl, provideDeviceIdService, provideSessionStorage } from '@universe/api'
import { createRpcConfigResolver, createUniRpcConfigResolver } from '@universe/chains'
import { isExtensionApp, REQUEST_SOURCE } from '@universe/environment'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'

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
  getFeatureFlag: () => getFeatureFlag(FeatureFlags.UniRpcEnabled),
  getEntryGatewayUrl,
  serviceId: REQUEST_SOURCE,
} as const

const webResolveUniRpcConfig = createUniRpcConfigResolver({
  ...SHARED_UNI_RPC_CONFIG,
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
      'x-request-source': REQUEST_SOURCE,
      ...(session?.sessionId && { 'X-Session-ID': session.sessionId }),
      ...(deviceId && { 'X-Device-ID': deviceId }),
    }
  },
})

export const defaultResolveRpcConfig = createRpcConfigResolver({
  resolveUniRpcConfig: isExtensionApp ? extensionResolveUniRpcConfig : webResolveUniRpcConfig,
  selectLegacyRpcUrl: selectRpcUrl,
})
