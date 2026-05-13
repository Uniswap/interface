import { getEntryGatewayUrl, provideDeviceIdService, provideSessionStorage } from '@universe/api'
import { createRpcConfigResolver, createUniRpcConfigResolver } from '@universe/chains'
import { REQUEST_SOURCE } from '@universe/environment'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'

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
    getFeatureFlag: () => getFeatureFlag(FeatureFlags.UniRpcEnabled),
    getEntryGatewayUrl,
    serviceId: REQUEST_SOURCE,
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
  }),
  selectLegacyRpcUrl: selectRpcUrl,
})
