import { providers as ethersProviders } from 'ethers/lib/ethers'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { SignerInfo } from 'uniswap/src/features/providers/FlashbotsCommon'
import { FlashbotsRpcProvider } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'
import { logger } from 'utilities/src/logger/logger'

// Should use ProviderManager for provider access unless being accessed outside of ProviderManagerContext (e.g., Apollo initialization)
export function createEthersProvider({
  chainId,
  rpcType = RPCType.Public,
  signerInfo,
}: {
  chainId: UniverseChainId
  rpcType?: RPCType
  signerInfo?: SignerInfo
}): ethersProviders.JsonRpcProvider | null {
  try {
    // Use the shared RPC URL selector
    const rpcConfig = selectRpcUrl(chainId, rpcType)
    if (!rpcConfig) {
      return null
    }

    // If we should use Flashbots, create a FlashbotsRpcProvider
    if (rpcConfig.shouldUseFlashbots && rpcConfig.flashbotsConfig) {
      const { refundPercent } = rpcConfig.flashbotsConfig
      return new FlashbotsRpcProvider({ signerInfo, refundPercent, network: chainId })
    }

    // Otherwise, create a standard JsonRpcProvider, passing the chainId to lower the number of needed RPC calls
    return new ethersProviders.JsonRpcProvider(rpcConfig.rpcUrl, chainId)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createEthersProvider', function: 'createProvider' },
      extra: { chainId, rpcType },
    })
    return null
  }
}
