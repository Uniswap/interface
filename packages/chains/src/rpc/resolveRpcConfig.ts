import type { UniRpcConfig } from './getUniRpcConfig'
import type { RpcConfig } from './rpcUrlSelector'
import { RPCType, UniverseChainId } from './types'

export interface RpcConfigResolverInput {
  chainId: UniverseChainId
  rpcType: RPCType
}

export type RpcConfigResolver = (input: RpcConfigResolverInput) => RpcConfig | null

interface RpcConfigResolverCtx {
  resolveUniRpcConfig: (input: { chainId: UniverseChainId }) => UniRpcConfig | null
  selectLegacyRpcUrl: (chainId: UniverseChainId, rpcType: RPCType) => RpcConfig | null
  // Promotes a legacy-path config to authenticated UniRPC when its URL is the entry
  // gateway. The gateway requires the session no matter how the URL was selected
  // (flag off, pre-Statsig, or a static Public-RPC fallback), so the auth decision
  // lives in one place instead of only on the primary branch. No-op for other URLs.
  asUniRpcConfig?: (config: RpcConfig) => RpcConfig
}

export function createRpcConfigResolver(ctx: RpcConfigResolverCtx): RpcConfigResolver {
  const promote = ctx.asUniRpcConfig ?? ((config: RpcConfig): RpcConfig => config)
  return (input: RpcConfigResolverInput): RpcConfig | null => {
    if (input.rpcType !== RPCType.Private) {
      const uniRpcConfig = ctx.resolveUniRpcConfig({ chainId: input.chainId })
      if (uniRpcConfig) {
        return {
          rpcUrl: uniRpcConfig.rpcUrl,
          isUniRpc: true,
          headers: uniRpcConfig.headers,
          getRequestHeaders: uniRpcConfig.getRequestHeaders,
          credentials: uniRpcConfig.credentials,
        }
      }
    }

    const legacyConfig = ctx.selectLegacyRpcUrl(input.chainId, input.rpcType)
    return legacyConfig ? promote(legacyConfig) : legacyConfig
  }
}
