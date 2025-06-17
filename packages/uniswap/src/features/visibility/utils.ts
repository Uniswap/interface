import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Generates a unique position ID for visibility tracking
 *
 * @param poolId - The pool's unique identifier
 * @param tokenId - The token's unique identifier
 * @param chainId - The chain ID where the position exists
 * @returns A string representing the unique position identifier
 */
export function getUniquePositionId({
  poolId,
  tokenId,
  chainId,
}: {
  poolId: string
  tokenId: string | undefined
  chainId: UniverseChainId
}): string {
  return `${poolId}-${tokenId}-${chainId}`
}
