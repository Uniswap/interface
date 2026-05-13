import { logger } from 'utilities/src/logger/logger'
import { FLASHBOTS_RPC_URL } from './FlashbotsCommon'
import { RPCType, UniverseChainId } from './types'
import type { RpcChainInfo } from './types'

// Types of configurations for RPC providers
export interface RpcConfig {
  rpcUrl: string
  /**
   * Set when this config targets the UniRPC entry gateway. Consumers should
   * branch on this flag (not on header presence) to decide whether to apply
   * UniRPC-specific transport behavior (session auth, 6s timeout, id:0 patch).
   */
  isUniRpc?: boolean
  shouldUseFlashbots?: boolean
  flashbotsConfig?: FlashbotsConfig
  /** Static headers to include in RPC requests (e.g., x-uni-service-id for UniRPC) */
  headers?: Record<string, string>
  /** Async callback resolved per-request for dynamic headers (e.g., session auth) */
  getRequestHeaders?: () => Promise<Record<string, string>>
  /** Fetch credentials mode — 'include' for cookie-based session auth on web */
  credentials?: 'include'
}

export interface FlashbotsConfig {
  refundPercent: number
  calldataHintsEnabled: boolean
}

export interface RpcUrlSelectorCtx {
  getChainInfo: (chainId: UniverseChainId) => RpcChainInfo
  getFlashbotsEnabled: () => boolean
  getFlashbotsRefundPercent: () => number
  getCalldataHintsEnabled: () => boolean
}

export type RpcUrlSelector = (chainId: UniverseChainId, rpcType?: RPCType) => RpcConfig | null

/**
 * Creates a selector that picks the appropriate RPC URL based on chain ID and RPC type.
 * All external dependencies (chain registry, gating experiments) are injected via ctx.
 */
export function createRpcUrlSelector(ctx: RpcUrlSelectorCtx): RpcUrlSelector {
  return (chainId: UniverseChainId, rpcType: RPCType = RPCType.Public): RpcConfig | null => {
    try {
      // Handle private RPC providers
      if (rpcType === RPCType.Private) {
        const privateRPCUrl = ctx.getChainInfo(chainId).rpcUrls[RPCType.Private]?.http[0]
        if (!privateRPCUrl) {
          throw new Error(`No private RPC available for chain ${chainId}`)
        }

        if (chainId === UniverseChainId.Mainnet && ctx.getFlashbotsEnabled()) {
          return {
            rpcUrl: FLASHBOTS_RPC_URL,
            shouldUseFlashbots: true,
            flashbotsConfig: {
              refundPercent: ctx.getFlashbotsRefundPercent(),
              calldataHintsEnabled: ctx.getCalldataHintsEnabled(),
            },
          }
        }

        return { rpcUrl: privateRPCUrl }
      }

      // Handle public RPC providers
      try {
        const publicRPCUrl = ctx.getChainInfo(chainId).rpcUrls[RPCType.Public]?.http[0]
        if (publicRPCUrl) {
          return { rpcUrl: publicRPCUrl }
        }
        throw new Error(`No public RPC available for chain ${chainId}`)
      } catch (error) {
        // Fall back to alternative public RPC URL if available
        const altPublicRPCUrl = ctx.getChainInfo(chainId).rpcUrls[RPCType.PublicAlt]?.http[0]
        if (altPublicRPCUrl) {
          return { rpcUrl: altPublicRPCUrl }
        }
        throw error
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'rpcUrlSelector', function: 'selectRpcUrl' },
        extra: { chainId, rpcType },
      })
      return null
    }
  }
}
