import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { describe, expect, it } from 'vitest'
import {
  mayShowNowTradingCard,
  shouldShowAuctionOnlyLayout,
  shouldShowClaimOnlyTimeline,
  shouldShowNowTradingCard,
  shouldShowTradeTokenBanner,
} from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

function withPool(overrides: Partial<AuctionDisplayState> = {}): AuctionDisplayState {
  return {
    phase: AuctionDisplayPhase.Live,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.HasPool,
    shouldShowSwap: true,
    ...overrides,
  }
}

const NOT_LIVE = Object.values(AuctionDisplayPhase).filter((phase) => phase !== AuctionDisplayPhase.Live)
const NOT_ENDED = Object.values(AuctionDisplayPhase).filter((phase) => phase !== AuctionDisplayPhase.Ended)
const NO_CONFIRMED_POOL = [PoolAvailability.Loading, PoolAvailability.Error, PoolAvailability.NoPool]

describe('shouldShowAuctionOnlyLayout', () => {
  const customWithoutPool = {
    launchMethod: LaunchProvenanceMethod.CustomAuction,
    phase: AuctionDisplayPhase.Live,
    poolAvailability: PoolAvailability.NoPool,
  }

  it.each([AuctionDisplayPhase.Upcoming, AuctionDisplayPhase.Live])(
    'replaces the trading layout for a known Custom auction without a pool in phase %s',
    (phase) => {
      expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, phase })).toBe(true)
    },
  )

  it.each([AuctionDisplayPhase.Loading, AuctionDisplayPhase.Unknown])(
    'keeps the trading layout until the auction phase is known: %s',
    (phase) => {
      expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, phase })).toBe(false)
    },
  )

  it('keeps the trading layout once the auction has ended', () => {
    expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, phase: AuctionDisplayPhase.Ended })).toBe(false)
  })

  it('keeps the trading layout once the token has a pool', () => {
    expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, poolAvailability: PoolAvailability.HasPool })).toBe(
      false,
    )
  })

  // A pending or failed lookup is not "no pool"; the swap stays offered in both.
  it.each([PoolAvailability.Loading, PoolAvailability.Error])(
    'keeps the trading layout while pool availability is %s',
    (poolAvailability) => {
      expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, poolAvailability })).toBe(false)
    },
  )

  it.each([
    LaunchProvenanceMethod.CrowdLaunch,
    LaunchProvenanceMethod.InstantLaunch,
    LaunchProvenanceMethod.ThirdParty,
    LaunchProvenanceMethod.Unknown,
    undefined,
  ])('keeps the trading layout for launch method %s', (launchMethod) => {
    expect(shouldShowAuctionOnlyLayout({ ...customWithoutPool, launchMethod })).toBe(false)
  })
})

describe('shouldShowTradeTokenBanner', () => {
  it('shows for a live auction whose token has a pool', () => {
    expect(shouldShowTradeTokenBanner(withPool())).toBe(true)
  })

  it('hides while the flag is off (no display state)', () => {
    expect(shouldShowTradeTokenBanner(undefined)).toBe(false)
  })

  it.each(NOT_LIVE)('hides in phase %s', (phase) => {
    expect(shouldShowTradeTokenBanner(withPool({ phase }))).toBe(false)
  })

  it.each(NO_CONFIRMED_POOL)('hides while pool availability is %s', (poolAvailability) => {
    expect(shouldShowTradeTokenBanner(withPool({ poolAvailability }))).toBe(false)
  })
})

describe('shouldShowClaimOnlyTimeline', () => {
  const endedSuccessfully = { phase: AuctionDisplayPhase.Ended, result: AuctionDisplayResult.Successful }

  it('uses claim-only copy once the pool is confirmed missing', () => {
    expect(
      shouldShowClaimOnlyTimeline(withPool({ ...endedSuccessfully, poolAvailability: PoolAvailability.NoPool })),
    ).toBe(true)
  })

  it('uses trading copy once a pool is confirmed', () => {
    expect(shouldShowClaimOnlyTimeline(withPool(endedSuccessfully))).toBe(false)
  })

  // shouldShowSwap still offers trading in both, so claim-only copy would contradict the same page.
  it.each([PoolAvailability.Loading, PoolAvailability.Error])(
    'keeps the neutral copy while pool availability is %s',
    (poolAvailability) => {
      expect(shouldShowClaimOnlyTimeline(withPool({ ...endedSuccessfully, poolAvailability }))).toBe(false)
    },
  )

  it('preserves the legacy copy while provenance is disabled', () => {
    expect(shouldShowClaimOnlyTimeline(undefined)).toBe(false)
  })

  it.each(NOT_ENDED)('preserves the existing copy in phase %s', (phase) => {
    expect(
      shouldShowClaimOnlyTimeline(withPool({ ...endedSuccessfully, phase, poolAvailability: PoolAvailability.NoPool })),
    ).toBe(false)
  })

  it.each([AuctionDisplayResult.Unknown, AuctionDisplayResult.Failed])(
    'does not claim a successful auction while the result is %s',
    (result) => {
      expect(
        shouldShowClaimOnlyTimeline(
          withPool({ ...endedSuccessfully, result, poolAvailability: PoolAvailability.NoPool }),
        ),
      ).toBe(false)
    },
  )
})

describe('shouldShowNowTradingCard', () => {
  const endedSuccessfully = { phase: AuctionDisplayPhase.Ended, result: AuctionDisplayResult.Successful }

  it('shows for a successful ended auction whose token has a pool', () => {
    expect(shouldShowNowTradingCard({ state: withPool(endedSuccessfully), tradingRestrictedUntilTge: false })).toBe(
      true,
    )
  })

  it('hides while the flag is off (no display state)', () => {
    expect(shouldShowNowTradingCard({ state: undefined, tradingRestrictedUntilTge: false })).toBe(false)
  })

  it.each(NOT_ENDED)('hides in phase %s', (phase) => {
    expect(
      shouldShowNowTradingCard({ state: withPool({ ...endedSuccessfully, phase }), tradingRestrictedUntilTge: false }),
    ).toBe(false)
  })

  it.each([AuctionDisplayResult.Unknown, AuctionDisplayResult.Failed])(
    'hides an ended auction while the result is %s',
    (result) => {
      expect(
        shouldShowNowTradingCard({
          state: withPool({ ...endedSuccessfully, result }),
          tradingRestrictedUntilTge: false,
        }),
      ).toBe(false)
    },
  )

  it('hides while trading is restricted until the TGE', () => {
    expect(shouldShowNowTradingCard({ state: withPool(endedSuccessfully), tradingRestrictedUntilTge: true })).toBe(
      false,
    )
  })

  it.each(NO_CONFIRMED_POOL)('hides an ended auction while pool availability is %s', (poolAvailability) => {
    expect(
      shouldShowNowTradingCard({
        state: withPool({ ...endedSuccessfully, poolAvailability }),
        tradingRestrictedUntilTge: false,
      }),
    ).toBe(false)
  })
})

describe('mayShowNowTradingCard', () => {
  // The chain head, the post-end checkpoint and the pool lookup settle at different times; the slot
  // holds a skeleton while any of them could still resolve into a visible card.
  const stillResolving = {
    phase: AuctionDisplayPhase.Loading,
    result: AuctionDisplayResult.Unknown,
    resultPending: true,
    poolAvailability: PoolAvailability.Loading,
  }

  it('reserves the slot while every input is still resolving', () => {
    expect(mayShowNowTradingCard({ state: withPool(stillResolving), tradingRestrictedUntilTge: false })).toBe(true)
  })

  it('reserves the slot for a card that is already visible', () => {
    expect(
      mayShowNowTradingCard({
        state: withPool({ phase: AuctionDisplayPhase.Ended, result: AuctionDisplayResult.Successful }),
        tradingRestrictedUntilTge: false,
      }),
    ).toBe(true)
  })

  it.each([AuctionDisplayPhase.Upcoming, AuctionDisplayPhase.Live])('collapses in phase %s', (phase) => {
    expect(
      mayShowNowTradingCard({ state: withPool({ ...stillResolving, phase }), tradingRestrictedUntilTge: false }),
    ).toBe(false)
  })

  it('collapses once the result is settled as failed', () => {
    expect(
      mayShowNowTradingCard({
        state: withPool({ ...stillResolving, result: AuctionDisplayResult.Failed, resultPending: false }),
        tradingRestrictedUntilTge: false,
      }),
    ).toBe(false)
  })

  it('collapses on an unknown result that is no longer pending', () => {
    expect(
      mayShowNowTradingCard({
        state: withPool({ ...stillResolving, resultPending: false }),
        tradingRestrictedUntilTge: false,
      }),
    ).toBe(false)
  })

  it.each([PoolAvailability.Error, PoolAvailability.NoPool])(
    'collapses once the pool lookup answers %s',
    (poolAvailability) => {
      expect(
        mayShowNowTradingCard({
          state: withPool({ ...stillResolving, poolAvailability }),
          tradingRestrictedUntilTge: false,
        }),
      ).toBe(false)
    },
  )

  it('collapses while trading is restricted until the TGE, whatever else is resolving', () => {
    expect(mayShowNowTradingCard({ state: withPool(stillResolving), tradingRestrictedUntilTge: true })).toBe(false)
  })

  it('collapses without a display state', () => {
    expect(mayShowNowTradingCard({ state: undefined, tradingRestrictedUntilTge: false })).toBe(false)
  })
})
