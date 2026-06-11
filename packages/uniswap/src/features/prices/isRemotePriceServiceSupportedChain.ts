import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'

/**
 * The remote price service is the source of truth for every known non-Solana
 * chain. Solana stays on the legacy quote path.
 */
export function isRemotePriceServiceSupportedChain(chainId: number): boolean {
  const supportedChainId = toSupportedChainId(chainId)
  return supportedChainId !== null && !isSVMChain(supportedChainId)
}
