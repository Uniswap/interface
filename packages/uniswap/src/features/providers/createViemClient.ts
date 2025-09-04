import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { SignerInfo } from 'uniswap/src/features/providers/FlashbotsCommon'
import { createFlashbotsRpcClient } from 'uniswap/src/features/providers/FlashbotsRpcClient'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'
import { logger } from 'utilities/src/logger/logger'
import { createPublicClient, defineChain, http, PublicClient, walletActions } from 'viem'

// Creates a viem PublicClient for the given chain
// Supports Flashbots for private RPC providers when needed
export function createViemClient({
  chainId,
  rpcType = RPCType.Public,
  signerInfo,
}: {
  chainId: UniverseChainId
  rpcType?: RPCType
  signerInfo?: SignerInfo
}): PublicClient | undefined {
  try {
    // Use the shared RPC URL selector
    const rpcConfig = selectRpcUrl(chainId, rpcType)
    if (!rpcConfig) {
      return undefined
    }

    // Define the chain for viem
    const chainInfo = getChainInfo(chainId)
    const viemChain = defineChain({
      id: chainInfo.id,
      name: chainInfo.name,
      nativeCurrency: chainInfo.nativeCurrency,
      rpcUrls: chainInfo.rpcUrls,
    })

    let client

    // Check if we should use Flashbots
    if (rpcConfig.shouldUseFlashbots && rpcConfig.flashbotsConfig) {
      client = createFlashbotsRpcClient({
        chain: viemChain,
        refundPercent: rpcConfig.flashbotsConfig.refundPercent,
        signerInfo,
      })
    } else {
      // Create a standard public client
      client = createPublicClient({
        chain: viemChain,
        transport: http(rpcConfig.rpcUrl),
      }).extend(walletActions)
    }

    return client
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createViemClient', function: 'createViemClient' },
      extra: { chainId, rpcType },
    })
    return undefined
  }
}
