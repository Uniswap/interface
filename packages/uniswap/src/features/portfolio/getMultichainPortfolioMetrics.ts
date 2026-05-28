import { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

export type MultichainRowReductionMetrics = {
  totalTokenRowCount: number
  multichainRowReductionCount: number
  multichainAssetCount: number
}

/**
 * Measures row condensation from per-row chain counts (e.g. explore `networkCount` or portfolio
 * `tokens.length`). Matches web portfolio `getPortfolioMultichainExpandRowMetrics` semantics.
 */
export function getMultichainRowReductionMetricsFromChainCounts(
  chainCounts: readonly number[],
): MultichainRowReductionMetrics {
  let totalTokenRowCount = 0
  let multichainRowReductionCount = 0
  let multichainAssetCount = 0
  for (const raw of chainCounts) {
    const chainCount = raw < 1 ? 1 : raw
    totalTokenRowCount += chainCount
    if (chainCount > 1) {
      multichainAssetCount += 1
      multichainRowReductionCount += chainCount - 1
    }
  }
  return { totalTokenRowCount, multichainRowReductionCount, multichainAssetCount }
}

/**
 * Measures how much the multichain token table condenses per-chain balances into one row per asset.
 * Matches web portfolio `getPortfolioMultichainExpandRowMetrics` semantics.
 */
export function getMultichainPortfolioMetrics(tokenData: PortfolioMultichainBalance[]): MultichainRowReductionMetrics {
  return getMultichainRowReductionMetricsFromChainCounts(tokenData.map((row) => row.tokens.length))
}
