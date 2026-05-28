import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'

/**
 * Flat row count is the sum of `chainTokens.length` per list entry; reduction counts extra chains beyond
 * the first for each multichain asset (Explore shows one parent row per `MultichainToken`).
 * Skips entries with no `chainTokens` (this should never happen).
 */
export function getExploreMultichainExpandRowMetrics(tokens: readonly MultichainToken[] | undefined): {
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
  for (const mc of tokens) {
    const chainCount = mc.chainTokens.length
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
