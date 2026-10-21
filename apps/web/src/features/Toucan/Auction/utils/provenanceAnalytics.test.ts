import { UniverseChainId } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { describe, expect, it } from 'vitest'
import {
  buildProvenanceAnalyticsProperties,
  getAnalyticsLaunchMethod,
  type ProvenanceAnalyticsInput,
} from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import {
  AuctionDisplayPhase,
  PoolAvailability,
  resolveAuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import type { TokenPoolState } from '~/types/tokenPool'

const CUSTOM_LIVE_NO_POOL: ProvenanceAnalyticsInput = {
  surface: 'tdp',
  chainId: UniverseChainId.Mainnet,
  launchMethod: LaunchProvenanceMethod.CustomAuction,
  phase: AuctionDisplayPhase.Live,
  poolAvailability: PoolAvailability.NoPool,
}

const ALLOWED_KEYS = [
  'auction_phase',
  'auction_type',
  'chain_id',
  'launch_method',
  'page_layout',
  'pool_availability',
  'surface',
]

describe('buildProvenanceAnalyticsProperties', () => {
  it.each([
    [LaunchProvenanceMethod.CustomAuction, 'custom'],
    [LaunchProvenanceMethod.CrowdLaunch, 'crowd'],
    [LaunchProvenanceMethod.InstantLaunch, 'instant'],
    [LaunchProvenanceMethod.ThirdParty, 'third_party'],
    [undefined, 'unknown'],
  ] as const)('keeps the current launch method vocabulary distinct for %s', (method, expected) => {
    expect(getAnalyticsLaunchMethod(method)).toBe(expected)
  })

  it('retains only the named navigation and multi-auction dimensions', () => {
    const payload = buildProvenanceAnalyticsProperties({
      ...CUSTOM_LIVE_NO_POOL,
      entry_point: 'tdp_auction_banner',
      auction_count: 3,
      has_auction_history: false,
      destination: 'auction_details',
    })
    expect(payload).toMatchObject({
      entry_point: 'tdp_auction_banner',
      auction_count: 3,
      has_auction_history: false,
      destination: 'auction_details',
      launch_method: 'custom',
    })
  })
  describe.each([
    [LaunchProvenanceMethod.CustomAuction, 'auction_only'],
    [LaunchProvenanceMethod.CrowdLaunch, 'trading'],
    [LaunchProvenanceMethod.InstantLaunch, 'trading'],
    [LaunchProvenanceMethod.ThirdParty, 'trading'],
    [LaunchProvenanceMethod.Unknown, 'trading'],
    [undefined, 'trading'],
  ] as const)('resolved TDP layout for %s', (launchMethod, noPoolLayout) => {
    it.each<{ pools: TokenPoolState; poolAvailability: string; pageLayout: string }>([
      { pools: { status: 'loading' }, poolAvailability: 'loading', pageLayout: 'trading' },
      { pools: { status: 'error' }, poolAvailability: 'error', pageLayout: 'trading' },
      { pools: { status: 'success', poolCount: 0 }, poolAvailability: 'no_pool', pageLayout: noPoolLayout },
      { pools: { status: 'success', poolCount: 1 }, poolAvailability: 'has_pool', pageLayout: 'trading' },
    ])('reports $pageLayout with $poolAvailability', ({ pools, poolAvailability, pageLayout }) => {
      const state = resolveAuctionDisplayState({
        auction: { startBlock: '100', endBlock: '200' },
        currentBlock: { status: 'success', blockNumber: 150n },
        currencyRaised: { status: 'idle' },
        pools,
      })

      expect(buildProvenanceAnalyticsProperties({ ...CUSTOM_LIVE_NO_POOL, ...state, launchMethod })).toMatchObject({
        pool_availability: poolAvailability,
        page_layout: pageLayout,
      })
    })
  })

  it('emits exactly the allowlisted keys as lowercase enums', () => {
    const payload = buildProvenanceAnalyticsProperties(CUSTOM_LIVE_NO_POOL)

    expect(Object.keys(payload).sort()).toEqual(ALLOWED_KEYS)
    expect(payload).toEqual({
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      auction_phase: 'live',
      pool_availability: 'no_pool',
      page_layout: 'auction_only',
    })
  })

  it('reports the trading layout for a Custom auction with a pool and for every Crowd launch', () => {
    expect(
      buildProvenanceAnalyticsProperties({
        ...CUSTOM_LIVE_NO_POOL,
        poolAvailability: PoolAvailability.HasPool,
      }),
    ).toMatchObject({ auction_type: 'custom', pool_availability: 'has_pool', page_layout: 'trading' })
    expect(
      buildProvenanceAnalyticsProperties({ ...CUSTOM_LIVE_NO_POOL, launchMethod: LaunchProvenanceMethod.CrowdLaunch }),
    ).toMatchObject({ auction_type: 'crowd', page_layout: 'trading' })
  })

  it('maps every phase and pool state, and an unresolved launch method, to a fixed vocabulary', () => {
    expect(
      buildProvenanceAnalyticsProperties({
        ...CUSTOM_LIVE_NO_POOL,
        launchMethod: undefined,
        phase: AuctionDisplayPhase.Loading,
        poolAvailability: PoolAvailability.Loading,
      }),
    ).toMatchObject({ auction_type: 'unknown', auction_phase: 'loading', pool_availability: 'loading' })
    expect(
      buildProvenanceAnalyticsProperties({
        ...CUSTOM_LIVE_NO_POOL,
        launchMethod: LaunchProvenanceMethod.InstantLaunch,
      }),
    ).toMatchObject({ auction_type: 'unknown', page_layout: 'trading' })
    expect(
      buildProvenanceAnalyticsProperties({
        ...CUSTOM_LIVE_NO_POOL,
        surface: 'adp',
        phase: AuctionDisplayPhase.Upcoming,
        poolAvailability: PoolAvailability.Error,
      }),
    ).toMatchObject({ surface: 'adp', auction_phase: 'upcoming', pool_availability: 'error' })
    expect(
      buildProvenanceAnalyticsProperties({ ...CUSTOM_LIVE_NO_POOL, phase: AuctionDisplayPhase.Ended }),
    ).toMatchObject({ auction_phase: 'ended', page_layout: 'trading' })
    expect(
      buildProvenanceAnalyticsProperties({ ...CUSTOM_LIVE_NO_POOL, phase: AuctionDisplayPhase.Unknown }),
    ).toMatchObject({ auction_phase: 'unknown' })
  })

  it('drops a wallet address, an amount and claim eligibility handed in alongside the display state', () => {
    const tainted = {
      ...CUSTOM_LIVE_NO_POOL,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      amount: '1500000000000000000',
      claimable: true,
    }

    const payload = buildProvenanceAnalyticsProperties(tainted)

    expect(Object.keys(payload).sort()).toEqual(ALLOWED_KEYS)
    expect(JSON.stringify(payload)).not.toMatch(/0x1234|1500000000000000000|claimable|walletAddress|amount/)
  })
})
