import { providers as ethersProviders } from 'ethers'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

// Should use ProviderManager for provider access unless being accessed outside of ProviderManagerContext (e.g., Apollo initialization)
export function createEthersProvider(
  chainId: WalletChainId,
  rpcType: RPCType = RPCType.Public,
): ethersProviders.JsonRpcProvider | null {
  try {
    if (rpcType === RPCType.Private) {
      const privateRPCUrl = UNIVERSE_CHAIN_INFO[chainId].rpcUrls?.[RPCType.Private]?.http[0]
      if (!privateRPCUrl) {
        throw new Error(`No private RPC available for chain ${chainId}`)
      }
      return new ethersProviders.JsonRpcProvider(privateRPCUrl)
    }

    try {
      const publicRPCUrl = UNIVERSE_CHAIN_INFO[chainId].rpcUrls?.[RPCType.Public]?.http[0]
      if (publicRPCUrl) {
        return new ethersProviders.JsonRpcProvider(publicRPCUrl)
      }
      throw new Error(`No public RPC available for chain ${chainId}`)
    } catch (error) {
      const altPublicRPCUrl = UNIVERSE_CHAIN_INFO[chainId].rpcUrls?.[RPCType.PublicAlt]?.http[0]
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
