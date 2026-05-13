import { logger } from 'utilities/src/logger/logger'
import { UniverseChainId } from './types'

export interface UniRpcConfig {
  rpcUrl: string
  headers: Record<string, string>
  getRequestHeaders?: () => Promise<Record<string, string>>
  credentials?: 'include'
}

interface UniRpcConfigResolverCtx {
  getFeatureFlag: () => boolean
  getEntryGatewayUrl: () => string
  serviceId: string
  getRequestHeaders?: () => Promise<Record<string, string>>
  credentials?: 'include'
}

interface UniRpcConfigResolverInput {
  chainId: UniverseChainId
}

/**
 * Creates a resolver that returns UniRPC configuration when the feature gate is enabled.
 *
 * UniRPC is a unified JSON-RPC proxy that handles provider selection, health monitoring, and failover
 * across all supported chains. When enabled, all chain-level RPC calls route through the entry gateway
 * at /rpc/{chainId} instead of direct provider endpoints (QuickNode, Infura, etc.).
 *
 * @example
 * ```ts
 * const resolveUniRpcConfig = createUniRpcConfigResolver({
 *   getFeatureFlag: () => getFeatureFlag(FeatureFlags.UniRpcEnabled),
 *   getEntryGatewayUrl,
 * })
 *
 * const config = resolveUniRpcConfig({ chainId: UniverseChainId.Mainnet })
 * if (config) {
 *   // use unirpc
 * }
 * ```
 */
export function createUniRpcConfigResolver(ctx: UniRpcConfigResolverCtx) {
  return (input: UniRpcConfigResolverInput): UniRpcConfig | null => {
    try {
      if (!ctx.getFeatureFlag()) {
        return null
      }

      const baseUrl = ctx.getEntryGatewayUrl()
      return {
        rpcUrl: `${baseUrl}/rpc/${input.chainId}`,
        headers: {
          'x-uni-service-id': ctx.serviceId,
        },
        getRequestHeaders: ctx.getRequestHeaders,
        credentials: ctx.credentials,
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'getUniRpcConfig', function: 'createUniRpcConfigResolver' },
        extra: { chainId: input.chainId },
      })
      return null
    }
  }
}
