import {
  ChainTokenRankStats,
  MultichainToken,
  RankedMultichainToken,
  TokenRankStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/data/util'
import {
  getVolumeBreakdownForPeriod,
  hasVolumeBreakdown,
} from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/utils'

const chainStat = (chainId: number, volume1d: number): ChainTokenRankStats =>
  new ChainTokenRankStats({ chainId, stats: new TokenRankStats({ volume1d }) })

describe('getVolumeBreakdownForPeriod', () => {
  it('excludes a flag-disabled leg with stats from the breakdown', () => {
    // The popover must show the same networks as the row's label/hover/link surfaces: a leg
    // outside the row's filtered set never appears, even when it carries the highest volume.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '143': '0xb' },
      }),
      chainStats: [chainStat(143, 1000), chainStat(1, 100)],
    })
    expect(
      getVolumeBreakdownForPeriod({
        rankedToken: token,
        timePeriod: TimePeriod.DAY,
        visibleChainIds: [UniverseChainId.Mainnet],
      }),
    ).toEqual([{ chainId: UniverseChainId.Mainnet, volume: 100 }])
  })

  it('keeps visible legs in volume order and drops zero-volume legs', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '10': '0xb', '8453': '0xc' },
      }),
      chainStats: [chainStat(10, 50), chainStat(1, 100), chainStat(8453, 0)],
    })
    expect(
      getVolumeBreakdownForPeriod({
        rankedToken: token,
        timePeriod: TimePeriod.DAY,
        visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism, UniverseChainId.Base],
      }),
    ).toEqual([
      { chainId: UniverseChainId.Mainnet, volume: 100 },
      { chainId: UniverseChainId.Optimism, volume: 50 },
    ])
  })

  it('returns an empty breakdown when no leg is visible', () => {
    const token = new RankedMultichainToken({
      chainStats: [chainStat(143, 1000)],
    })
    expect(
      getVolumeBreakdownForPeriod({ rankedToken: token, timePeriod: TimePeriod.DAY, visibleChainIds: [] }),
    ).toEqual([])
  })
})

describe('hasVolumeBreakdown', () => {
  it('is false for one stats-bearing leg plus one stats-less leg (no dead affordance)', () => {
    // The network count is 2 (stats-less legs count as networks) but only one breakdown row
    // exists, so the popover would never open; the cell's info icon must not render.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '57073': '0xb' },
      }),
      chainStats: [chainStat(1, 100)],
    })
    expect(
      hasVolumeBreakdown({
        rankedToken: token,
        timePeriod: TimePeriod.DAY,
        visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Ink],
      }),
    ).toBe(false)
  })

  it('is true for two visible stats-bearing legs', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '10': '0xb' },
      }),
      chainStats: [chainStat(1, 100), chainStat(10, 50)],
    })
    expect(
      hasVolumeBreakdown({
        rankedToken: token,
        timePeriod: TimePeriod.DAY,
        visibleChainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism],
      }),
    ).toBe(true)
  })

  it('is false when the second stats leg is outside the visible set', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '143': '0xb' },
      }),
      chainStats: [chainStat(1, 100), chainStat(143, 1000)],
    })
    expect(
      hasVolumeBreakdown({
        rankedToken: token,
        timePeriod: TimePeriod.DAY,
        visibleChainIds: [UniverseChainId.Mainnet],
      }),
    ).toBe(false)
  })
})
