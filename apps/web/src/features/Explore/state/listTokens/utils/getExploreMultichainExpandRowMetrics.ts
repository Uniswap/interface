import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'

/**
 * Flat row count is the sum of chain-deployment counts (`multichainToken.addresses` keys) per
 * list entry; reduction counts extra chains beyond the first for each multichain asset (Explore
 * shows one parent row per `RankedMultichainToken`). Skips entries with no deployments (this
 * should never happen).
 */
export function getExploreMultichainExpandRowMetrics(tokens: readonly RankedMultichainToken[] | undefined): {
  totalTokenRowCount: number
  multichainRowReductionCount: number
  multichainAssetCount: number
} {
  if (!tokens?.length) {
    return { totalTokenRowCount: 0, multichainRowReductionCount: 0, multichainAssetCount: 0 }
  }
  let totalTokenRowCount = 0
  let multichainRowReductionCount = 0
  let multichainAssetCount = 0
  for (const ranked of tokens) {
    const chainCount = Object.keys(ranked.multichainToken?.addresses ?? {}).length
    if (chainCount === 0) {
      continue
    }
    totalTokenRowCount += chainCount
    if (chainCount > 1) {
      multichainAssetCount += 1
      multichainRowReductionCount += chainCount - 1
    }
  }
  return { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount }
}
