import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { Experiments, PrivateRpcProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import {
  DEFAULT_FLASHBOTS_ENABLED,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
  FLASHBOTS_RPC_URL,
} from 'uniswap/src/features/providers/FlashbotsCommon'
import { logger } from 'utilities/src/logger/logger'

// Types of configurations for RPC providers
export interface RpcConfig {
  rpcUrl: string
  shouldUseFlashbots?: boolean
  flashbotsConfig?: FlashbotsConfig
}

export interface FlashbotsConfig {
  refundPercent: number
}

/**
 * Selects the appropriate RPC URL based on the chain ID and RPC type
 * This utility is shared between createEthersProvider and createViemClient
 */
export function selectRpcUrl(chainId: UniverseChainId, rpcType: RPCType = RPCType.Public): RpcConfig | null {
  try {
    // Handle private RPC providers
    if (rpcType === RPCType.Private) {
      const privateRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.Private]?.http[0]
      if (!privateRPCUrl) {
        throw new Error(`No private RPC available for chain ${chainId}`)
      }

      const flashbotsEnabled = getExperimentValue<Experiments.PrivateRpc, PrivateRpcProperties, boolean>(
        Experiments.PrivateRpc,
        PrivateRpcProperties.FlashbotsEnabled,
        DEFAULT_FLASHBOTS_ENABLED,
      )

      if (chainId === UniverseChainId.Mainnet && flashbotsEnabled) {
        const flashbotsRefundPercent = getExperimentValue<Experiments.PrivateRpc, PrivateRpcProperties, number>(
          Experiments.PrivateRpc,
          PrivateRpcProperties.RefundPercent,
          FLASHBOTS_DEFAULT_REFUND_PERCENT,
        )
        return {
          rpcUrl: FLASHBOTS_RPC_URL,
          shouldUseFlashbots: true,
          flashbotsConfig: {
            refundPercent: flashbotsRefundPercent,
          },
        }
      }

      return { rpcUrl: privateRPCUrl }
    }

    // Handle public RPC providers
    try {
      const publicRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.Public]?.http[0]
      if (publicRPCUrl) {
        return { rpcUrl: publicRPCUrl }
      }
      throw new Error(`No public RPC available for chain ${chainId}`)
    } catch (error) {
      // Fall back to alternative public RPC URL if available
      const altPublicRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.PublicAlt]?.http[0]
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
