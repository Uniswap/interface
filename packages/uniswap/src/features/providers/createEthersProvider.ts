import { providers as ethersProviders } from 'ethers/lib/ethers'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { DynamicConfigs, MainnetPrivateRpcConfigKey } from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import {
  FLASHBOTS_DEFAULT_BLOCK_RANGE,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
  FlashbotsRpcProvider,
  SignerInfo,
} from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { logger } from 'utilities/src/logger/logger'

// Should use ProviderManager for provider access unless being accessed outside of ProviderManagerContext (e.g., Apollo initialization)
export function createEthersProvider(
  chainId: UniverseChainId,
  rpcType: RPCType = RPCType.Public,
  signerInfo?: SignerInfo,
): ethersProviders.JsonRpcProvider | null {
  try {
    if (rpcType === RPCType.Private) {
      const privateRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.Private]?.http[0]
      if (!privateRPCUrl) {
        throw new Error(`No private RPC available for chain ${chainId}`)
      }

      const useFlashbots = getDynamicConfigValue<DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey, boolean>(
        DynamicConfigs.MainnetPrivateRpc,
        MainnetPrivateRpcConfigKey.UseFlashbots,
        false,
      )

      if (chainId === UniverseChainId.Mainnet && useFlashbots) {
        const sendAuthenticationHeader = getDynamicConfigValue<
          DynamicConfigs.MainnetPrivateRpc,
          MainnetPrivateRpcConfigKey,
          boolean
        >(DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey.SendFlashbotsAuthenticationHeader, false)

        const flashbotsBlockRange = getDynamicConfigValue<
          DynamicConfigs.MainnetPrivateRpc,
          MainnetPrivateRpcConfigKey,
          number
        >(
          DynamicConfigs.MainnetPrivateRpc,
          MainnetPrivateRpcConfigKey.FlashbotsBlockRange,
          FLASHBOTS_DEFAULT_BLOCK_RANGE,
        )

        const flashbotsRefundPercent = getDynamicConfigValue<
          DynamicConfigs.MainnetPrivateRpc,
          MainnetPrivateRpcConfigKey,
          number
        >(
          DynamicConfigs.MainnetPrivateRpc,
          MainnetPrivateRpcConfigKey.FlashbotsRefundPercent,
          FLASHBOTS_DEFAULT_REFUND_PERCENT,
        )

        return new FlashbotsRpcProvider(
          flashbotsBlockRange,
          sendAuthenticationHeader ? signerInfo : undefined,
          flashbotsRefundPercent,
        )
      }

      return new ethersProviders.JsonRpcProvider(privateRPCUrl)
    }

    try {
      const publicRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.Public]?.http[0]
      if (publicRPCUrl) {
        return new ethersProviders.JsonRpcProvider(publicRPCUrl)
      }
      throw new Error(`No public RPC available for chain ${chainId}`)
    } catch (error) {
      const altPublicRPCUrl = getChainInfo(chainId).rpcUrls?.[RPCType.PublicAlt]?.http[0]
      return new ethersProviders.JsonRpcProvider(altPublicRPCUrl)
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createEthersProvider', function: 'createProvider' },
      extra: { chainId },
    })
    return null
  }
}
