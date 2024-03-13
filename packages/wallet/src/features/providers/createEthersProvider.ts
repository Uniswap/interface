import { providers as ethersProviders } from 'ethers'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'
import { CHAIN_INFO, ChainId, RPCType } from 'wallet/src/constants/chains'
import { getInfuraChainName } from 'wallet/src/features/providers/utils'

// Should use ProviderManager for provider access unless being accessed outside of ProviderManagerContext (e.g., Apollo initialization)
export function createEthersProvider(
  chainId: ChainId,
  rpcType: RPCType = RPCType.Public
): ethersProviders.JsonRpcProvider | null {
  try {
    if (rpcType === RPCType.Private) {
      const privateRPCUrl = CHAIN_INFO[chainId].rpcUrls?.[RPCType.Private]
      if (!privateRPCUrl) {
        throw new Error(`No private RPC available for chain ${chainId}`)
      }
      return new ethersProviders.JsonRpcProvider(privateRPCUrl)
    }

    try {
      const publicRPCUrl = CHAIN_INFO[chainId].rpcUrls?.[RPCType.Public]
      if (publicRPCUrl) {
        return new ethersProviders.JsonRpcProvider(publicRPCUrl)
      }

      return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
    } catch (error) {
      const altPublicRPCUrl = CHAIN_INFO[chainId].rpcUrls?.[RPCType.PublicAlt]
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
