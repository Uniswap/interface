import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { describe, expect, it } from 'vitest'
import { getExploreMultichainExpandRowMetrics } from '~/features/Explore/state/listTokens/utils/getExploreMultichainExpandRowMetrics'

function mockMc(chainTokenCount: number): MultichainToken {
  return { chainTokens: Array.from({ length: chainTokenCount }, () => ({})) } as MultichainToken
}

describe('getExploreMultichainExpandRowMetrics', () => {
  it('returns zeros for undefined or empty', () => {
    expect(getExploreMultichainExpandRowMetrics(undefined)).toEqual({
      totalTokenRowCount: 0,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
    expect(getExploreMultichainExpandRowMetrics([])).toEqual({
      totalTokenRowCount: 0,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
  })

  it('ignores tokens with no chain deployments', () => {
    expect(getExploreMultichainExpandRowMetrics([mockMc(0)])).toEqual({
      totalTokenRowCount: 0,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
  })

  it('counts single-chain rows with no reduction', () => {
    expect(getExploreMultichainExpandRowMetrics([mockMc(1), mockMc(1)])).toEqual({
      totalTokenRowCount: 2,
      multichainRowReductionCount: 0,
      multichainAssetCount: 0,
    })
  })

  it('adds reduction for extra chains on multichain assets', () => {
    expect(getExploreMultichainExpandRowMetrics([mockMc(3), mockMc(1)])).toEqual({
      totalTokenRowCount: 4,
      multichainRowReductionCount: 2,
      multichainAssetCount: 1,
    })
  })
})
