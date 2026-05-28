import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it } from 'vitest'
import {
  getMultichainPortfolioMetrics,
  getMultichainRowReductionMetricsFromChainCounts,
} from './getMultichainPortfolioMetrics'
describe('getMultichainPortfolioMetrics', () => {
  it('returns zeros for an empty list', () => {
    expect(getMultichainPortfolioMetrics([])).toEqual({
      totalTokenRowCount: 0,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
  })

  it('counts single-chain assets with no reduction', () => {
    const a = createPortfolioMultichainBalance({ id: 'a' })
    const b = createPortfolioMultichainBalance({ id: 'b' })
    expect(getMultichainPortfolioMetrics([a, b])).toEqual({
      totalTokenRowCount: 2,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
  })

  it('aggregates multichain assets into reduction counts', () => {
    const single = createPortfolioMultichainBalance({ id: 'single' })
    const multi = createPortfolioMultichainBalance({
      id: 'multi',
      tokens: [
        createPortfolioChainBalance({ chainId: 1 }),
        createPortfolioChainBalance({ chainId: 42161 }),
        createPortfolioChainBalance({ chainId: 10 }),
      ],
    })
    expect(getMultichainPortfolioMetrics([single, multi])).toEqual({
      totalTokenRowCount: 4,
      multichainRowReductionCount: 2,
      multichainAssetCount: 1,
    })
  })
})

describe('getMultichainRowReductionMetricsFromChainCounts', () => {
  it('treats non-positive counts as one chain', () => {
    expect(getMultichainRowReductionMetricsFromChainCounts([0, -1, 2])).toEqual({
      totalTokenRowCount: 4,
      multichainRowReductionCount: 1,
      multichainAssetCount: 1,
    })
  })

  it('matches portfolio metrics for explicit chain counts', () => {
    expect(getMultichainRowReductionMetricsFromChainCounts([1, 1, 3])).toEqual({
      totalTokenRowCount: 5,
      multichainRowReductionCount: 2,
      multichainAssetCount: 1,
    })
  })
})
