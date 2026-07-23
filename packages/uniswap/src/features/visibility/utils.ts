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

/**
 * Inverse of {@link getUniquePositionId}; recovers fields for legacy visibility entries
 * that pre-date storing them on the slice value. Splits from the end because poolId (EVM
 * address or bytes32 hex) never contains `-`. The literal "undefined" tokenId segment
 * (V2 encoding) maps back to actual `undefined` so callers don't special-case the sentinel.
 */
export function parsePositionId(
  positionId: string,
): { poolId: string; tokenId: string | undefined; chainId: UniverseChainId } | null {
  const parts = positionId.split('-')
  if (parts.length < 3) {
    return null
  }
  const chainId = Number(parts[parts.length - 1])
  if (!Number.isFinite(chainId) || chainId <= 0) {
    return null
  }
  const tokenIdSegment = parts[parts.length - 2]
  const tokenId = tokenIdSegment === 'undefined' ? undefined : tokenIdSegment
  const poolId = parts.slice(0, parts.length - 2).join('-')
  if (!poolId) {
    return null
  }
  return { poolId, tokenId, chainId: chainId as UniverseChainId }
}
