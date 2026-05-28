import { logger } from 'utilities/src/logger/logger'
import { createPublicClient, defineChain, http, PublicClient, Transport, walletActions } from 'viem'
import { createUniRpcTransportFactory } from './createUniRpcTransport'
import { SignerInfo } from './FlashbotsCommon'
import { createFlashbotsRpcClient } from './FlashbotsRpcClient'
import { createObservableTransport } from './observability/createObservableTransport'
import { getRpcObserver } from './observability/rpcObserver'
import type { RpcConfigResolver } from './resolveRpcConfig'
import { RPCType, UniverseChainId } from './types'
import type { ViemChainInfo } from './types'

export interface CreateViemClientFactoryCtx {
  resolveRpcConfig: RpcConfigResolver
  getChainInfo: (chainId: UniverseChainId) => ViemChainInfo
  areAddressesEqual: (a: string, b: string) => boolean
}

interface CreateViemClientInput {
  chainId: UniverseChainId
  rpcType: RPCType
  signerInfo?: SignerInfo
}

export type CreateViemClient = (input: CreateViemClientInput) => PublicClient | undefined

export function createViemClientFactory(ctx: CreateViemClientFactoryCtx): CreateViemClient {
  return (input: CreateViemClientInput): PublicClient | undefined => {
    try {
      const rpcConfig = ctx.resolveRpcConfig({ chainId: input.chainId, rpcType: input.rpcType })
      if (!rpcConfig) {
        return undefined
      }

      const chainInfo = ctx.getChainInfo(input.chainId)
      const viemChain = defineChain({
        id: chainInfo.id,
        name: chainInfo.name,
        nativeCurrency: chainInfo.nativeCurrency,
        rpcUrls: chainInfo.rpcUrls,
      })

      if (rpcConfig.shouldUseFlashbots && rpcConfig.flashbotsConfig) {
        return createFlashbotsRpcClient({
          chain: viemChain,
          refundPercent: rpcConfig.flashbotsConfig.refundPercent,
          calldataHintsEnabled: rpcConfig.flashbotsConfig.calldataHintsEnabled,
          signerInfo: input.signerInfo,
          areAddressesEqual: ctx.areAddressesEqual,
          observer: getRpcObserver(),
        })
      }

      // Route UniRPC-bound configs through createUniRpcTransportFactory so
      // session handling, the 6s timeout, and the id:0 defense-in-depth patch
      // are applied consistently. Branch on the explicit `isUniRpc` flag —
      // earlier versions sniffed for header presence, which was an implicit
      // contract that any legacy provider with static headers could break.
      let baseTransport: Transport
      if (rpcConfig.isUniRpc) {
        const uniRpcTransportConfig = { rpcUrl: rpcConfig.rpcUrl, headers: rpcConfig.headers ?? {} }
        const { getRequestHeaders } = rpcConfig
        if (getRequestHeaders) {
          baseTransport = createUniRpcTransportFactory({
            session: { type: 'headers', getSessionHeaders: getRequestHeaders },
          })({ config: uniRpcTransportConfig })
        } else {
          // Cookie-based session auth (web). The transport unconditionally
          // sets credentials: 'include' for the cookies branch.
          baseTransport = createUniRpcTransportFactory({
            session: { type: 'cookies' },
          })({ config: uniRpcTransportConfig })
        }
      } else {
        baseTransport = http(rpcConfig.rpcUrl, {
          fetchOptions: rpcConfig.headers ? { headers: rpcConfig.headers } : undefined,
        })
      }

      return createPublicClient({
        chain: viemChain,
        transport: createObservableTransport({
          baseTransportFactory: baseTransport,
          observer: getRpcObserver(),
          meta: { chainId: input.chainId, url: rpcConfig.rpcUrl },
        }),
      }).extend(walletActions)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createViemClient', function: 'createViemClient' },
        extra: { chainId: input.chainId, rpcType: input.rpcType },
      })
      return undefined
    }
  }
}
