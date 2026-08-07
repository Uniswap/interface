import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'

/**
 * Flat row count is the sum of chain-deployment counts (`multichainToken.addresses` keys) per
 * list entry; reduction counts extra chains beyond the first for each multichain asset (Explore
 * shows one parent row per `RankedMultichainToken`). Skips entries with no deployments (this
 * should never happen).
 *
 * Deliberately counts RAW addresses, not the registry + rollout-flag filtered set the rendered
 * UI uses: this metric measures the backend's grouping efficacy, and its baseline must not
 * shift when a client-side chain flag flips. Caveat: the input is the display list, which drops
 * tokens whose filtered set is empty, so a flag flip that zeroes out every leg of a token does
 * remove that token's raw count from the totals.
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
