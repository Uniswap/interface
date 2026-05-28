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
}

export function createRpcConfigResolver(ctx: RpcConfigResolverCtx): RpcConfigResolver {
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

    return ctx.selectLegacyRpcUrl(input.chainId, input.rpcType)
  }
}
