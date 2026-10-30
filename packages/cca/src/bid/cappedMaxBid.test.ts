import { describe, expect, it } from 'vitest'
import { calculateCappedMaxBidQ96, fdvToPriceQ96 } from './cappedMaxBid'
import { calculateMinValidBidQ96 as minValidBidQ96, parseQ96, Q96 } from './ticks'

// Replayed from apps/pools-xyz's lib/bid/bidMath.test.ts with only this preamble changed. Pools'
// chain-registry wrappers are rebuilt here from the package primitives they now delegate to, with
// the app-level inputs they read: the SDK's quick-launch preset supply and each chain's
// `raiseCurrency` (apps/pools-xyz/app/lib/chains.ts).
const QUICK_LAUNCH_TOTAL_SUPPLY_RAW = 10n ** 27n
const robinhoodChain = { id: 4663 } as const
const arcChain = { id: 5042 } as const
const RAISE_CURRENCY = {
  [robinhoodChain.id]: { decimals: 18, maxBidFdv: 25_000n },
  [arcChain.id]: { decimals: 18, maxBidFdv: 50_000_000n },
} as const
type ChainId = keyof typeof RAISE_CURRENCY

function bidMaxFdv(chainId: ChainId): bigint {
  return RAISE_CURRENCY[chainId].maxBidFdv
}

function bidMaxPriceFdvCapQ96(chainId: ChainId): bigint {
  const { decimals, maxBidFdv } = RAISE_CURRENCY[chainId]
  return fdvToPriceQ96({ fdvRaw: maxBidFdv * 10n ** BigInt(decimals), totalSupplyRaw: QUICK_LAUNCH_TOTAL_SUPPLY_RAW })
}

function bidMaxPriceQ96({
  chainId,
  ...grid
}: {
  chainId: ChainId
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint {
  return calculateCappedMaxBidQ96({ capQ96: bidMaxPriceFdvCapQ96(chainId), ...grid })
}

// Live 4663 vectors (ZUZU / METEOR auctions, read 2026-07-26): floor sits at
// exactly 100 ticks, so grid math is exact and hand-checkable.
const TICK = 4_753_689_750_855_860_255n
const FLOOR = TICK * 100n // 475368975085586025500
/** Every vector below is a Robinhood auction unless it says otherwise. */
const CHAIN = robinhoodChain.id
const CAP = bidMaxPriceFdvCapQ96(CHAIN)

describe('minValidBidQ96', () => {
  it('is the first tick strictly above clearing when clearing sits on the grid', () => {
    // ZUZU: clearing == floor → minValid = floor + 1 tick (verified live-accepted).
    expect(minValidBidQ96({ clearingPriceQ96: FLOOR, floorPriceQ96: FLOOR, tickSizeQ96: TICK })).toBe(FLOOR + TICK)
  })

  it('handles a clearing price below the floor grid (no bids yet)', () => {
    // METEOR: clearing 0 → toward-zero division lands on the first tick (verified).
    expect(minValidBidQ96({ clearingPriceQ96: 0n, floorPriceQ96: FLOOR, tickSizeQ96: TICK })).toBe(TICK)
  })

  it('steps to the next whole tick above a clearing between ticks', () => {
    const clearing = FLOOR + TICK + TICK / 2n // 101.5 ticks
    expect(minValidBidQ96({ clearingPriceQ96: clearing, floorPriceQ96: FLOOR, tickSizeQ96: TICK })).toBe(
      FLOOR + 2n * TICK,
    )
  })

  it('degrades to clearing + 1 when tick size is non-positive', () => {
    expect(minValidBidQ96({ clearingPriceQ96: 5n, floorPriceQ96: 0n, tickSizeQ96: 0n })).toBe(6n)
  })
})

describe('bidMaxPriceFdvCapQ96', () => {
  it('is the 25,000 ETH FDV spread over the preset supply, floored, = 2^96 / 40,000', () => {
    // 25_000 ETH-wei FDV / 1e27 raw supply = 2.5e-5 ETH-wei per token-wei.
    expect(bidMaxFdv(CHAIN)).toBe(25_000n)
    expect(QUICK_LAUNCH_TOTAL_SUPPLY_RAW).toBe(10n ** 27n)
    expect(CAP).toBe(Q96 / 40_000n)
    expect(CAP).toBe(1_980_704_062_856_608_439_838_598n)
  })

  // The cap is denominated in what the chain RAISES, so a second chain gets a
  // second figure — not Robinhood's ETH number reused against USDC.
  it('is the chain’s own raise-currency FDV, so Arc caps in USDC not ETH', () => {
    // 50M USDC — product decision, see chains.ts.
    expect(bidMaxFdv(arcChain.id)).toBe(50_000_000n)
    // 50M raw-18 FDV over the 1e27 preset supply = 2^96 / 20.
    expect(bidMaxPriceFdvCapQ96(arcChain.id)).toBe(Q96 / 20n)
    // Both raise currencies are 18-decimal, so the caps differ by exactly the
    // FDV ratio (2,000×) up to the integer floor Robinhood's cap takes.
    expect(bidMaxPriceFdvCapQ96(arcChain.id) - CAP * 2_000n).toBeLessThan(2_000n)
  })

  it('round-trips back to the intended FDV within integer-floor loss', () => {
    for (const chainId of [robinhoodChain.id, arcChain.id] as const) {
      const fdvRaw = (bidMaxPriceFdvCapQ96(chainId) * QUICK_LAUNCH_TOTAL_SUPPLY_RAW) / Q96
      const targetRaw = bidMaxFdv(chainId) * 10n ** 18n
      expect(fdvRaw <= targetRaw).toBe(true)
      // The cap's integer floor costs at most 1 raw unit of the target FDV.
      expect(targetRaw - fdvRaw <= 1n).toBe(true)
    }
  })

  it('sits far above a real launch floor (the $1k-FDV preset)', () => {
    // Fixture floor is a live preset floor (~$1k FDV); the 25k-ETH cap must
    // dwarf it so ordinary bids never hit the minValid clamp.
    expect(CAP > FLOOR * 1_000n).toBe(true)
  })
})

describe('bidMaxPriceQ96', () => {
  it('snaps the FDV cap down onto the floor-anchored tick grid', () => {
    const maxPrice = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: FLOOR,
      floorPriceQ96: FLOOR,
      tickSizeQ96: TICK,
    })
    // On the grid, within one tick below the cap (never above — snapping up
    // would overshoot the 25,000 ETH FDV product cap), strictly above clearing.
    expect((maxPrice - FLOOR) % TICK).toBe(0n)
    expect(maxPrice <= CAP).toBe(true)
    expect(CAP - maxPrice < TICK).toBe(true)
    expect(maxPrice > FLOOR).toBe(true)
  })

  it('does not move with the clearing price while below the cap (the old 50× ceiling did)', () => {
    const atFloor = bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96: FLOOR, floorPriceQ96: FLOOR, tickSizeQ96: TICK })
    const noBids = bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96: 0n, floorPriceQ96: FLOOR, tickSizeQ96: TICK })
    // Clearing at 200× the floor — beyond the old multiple, which would have
    // dropped the bid; the fixed cap keeps it included.
    const bidUp = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: FLOOR * 200n,
      floorPriceQ96: FLOOR,
      tickSizeQ96: TICK,
    })
    expect(noBids).toBe(atFloor)
    expect(bidUp).toBe(atFloor)
    expect(bidUp > FLOOR * 200n).toBe(true)
  })

  it('clamps up to the minimum valid bid when clearing already implies an FDV above the cap', () => {
    // Clearing one tick past the cap: the snapped cap is no longer strictly
    // above clearing, so the bid goes in minimally-above-clearing instead of
    // failing (the stated clamp semantics).
    const cappedTicks = (CAP - FLOOR) / TICK
    const clearing = FLOOR + (cappedTicks + 1n) * TICK
    const maxPrice = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: clearing,
      floorPriceQ96: FLOOR,
      tickSizeQ96: TICK,
    })
    expect(maxPrice).toBe(minValidBidQ96({ clearingPriceQ96: clearing, floorPriceQ96: FLOOR, tickSizeQ96: TICK }))
    expect(maxPrice).toBe(clearing + TICK)
    expect(maxPrice > CAP).toBe(true)
  })

  it('never returns below the floor when the floor exceeds the cap and clearing is unknown', () => {
    // Pure-function contract: on-chain clearing is never 0 — it starts AT the
    // floor — so a zero clearing is a data gap. The app's mapping layer fails
    // fast on a reported "0" (undefined → panel error stage before bidMath
    // runs); this pins the defense-in-depth clamp for any other caller. A
    // result at or below the floor is rejected by the contract twice over
    // (BidMustBeAboveClearingPrice, then TickPreviousPriceInvalid via the
    // floor prev-tick hint).
    const bigFloor = TICK * 2n ** 50n
    expect(bigFloor > CAP).toBe(true)
    expect(
      bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96: 0n, floorPriceQ96: bigFloor, tickSizeQ96: TICK }) > bigFloor,
    ).toBe(true)
  })

  it('never returns below the contract minimum valid bid', () => {
    // Floor above the cap: grid snapping can't reach the target, so the
    // minimum-valid clamp (first tick strictly above clearing) takes over.
    const bigFloor = TICK * 2n ** 50n
    expect(bigFloor > CAP).toBe(true)
    const maxPrice = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: bigFloor,
      floorPriceQ96: bigFloor,
      tickSizeQ96: TICK,
    })
    expect(maxPrice).toBe(minValidBidQ96({ clearingPriceQ96: bigFloor, floorPriceQ96: bigFloor, tickSizeQ96: TICK }))
    expect(maxPrice).toBe(bigFloor + TICK)
  })

  it('clamps to the minimum valid bid when the tick grid is too coarse to express the cap', () => {
    // Tick size exceeds cap − floor: the snap truncates to the floor, so the
    // minValid clamp yields the one-tick-above-clearing ceiling — which may
    // exceed the cap (the contract requires strictly-above-clearing).
    const coarseTick = CAP
    expect(coarseTick > CAP - FLOOR).toBe(true)
    const maxPrice = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: FLOOR,
      floorPriceQ96: FLOOR,
      tickSizeQ96: coarseTick,
    })
    expect(maxPrice).toBe(minValidBidQ96({ clearingPriceQ96: FLOOR, floorPriceQ96: FLOOR, tickSizeQ96: coarseTick }))
    expect(maxPrice).toBe(FLOOR + coarseTick)
    expect(maxPrice > CAP).toBe(true)
  })

  it('clamps to the minimum valid bid on a degenerate zero floor', () => {
    const maxPrice = bidMaxPriceQ96({
      chainId: CHAIN,
      clearingPriceQ96: 0n,
      floorPriceQ96: 0n,
      tickSizeQ96: CAP * 2n,
    })
    expect(maxPrice).toBe(CAP * 2n)
  })

  it('never submits above the contract MAX_BID_PRICE for a realistic supply', () => {
    // 2^108 is the universal MAX_BID_PRICE infimum over every constructible
    // auction (attained only at the 2^100 max supply; the contract comparison
    // is non-strict). Independent literal on purpose — asserting against the
    // module's own cap constant would make the test tautological.
    const maxBidPriceUniversalMin = 2n ** 108n
    // A creator floor above the FDV cap is constructible (the constructor only
    // requires floor + tickSpacing <= MAX_BID_PRICE) and is the one leg where
    // the result exceeds the cap, so the sweep covers it alongside the preset
    // floor. Kept within the universal MAX_BID_PRICE minimum so the auction is
    // constructible at ANY supply.
    const bigFloor = TICK * 2n ** 30n
    expect(bigFloor > CAP).toBe(true)
    expect(bigFloor + TICK <= maxBidPriceUniversalMin).toBe(true)
    const cases: { clearingPriceQ96: bigint; floorPriceQ96: bigint }[] = [
      { clearingPriceQ96: 0n, floorPriceQ96: FLOOR },
      { clearingPriceQ96: FLOOR, floorPriceQ96: FLOOR },
      { clearingPriceQ96: FLOOR * 50n, floorPriceQ96: FLOOR },
      { clearingPriceQ96: FLOOR * 200n, floorPriceQ96: FLOOR },
      { clearingPriceQ96: CAP - TICK, floorPriceQ96: FLOOR },
      { clearingPriceQ96: CAP + TICK, floorPriceQ96: FLOOR },
      // Floor-above-cap leg: clearing reported 0 (data gap), at the floor,
      // and bid up past it.
      { clearingPriceQ96: 0n, floorPriceQ96: bigFloor },
      { clearingPriceQ96: bigFloor, floorPriceQ96: bigFloor },
      { clearingPriceQ96: bigFloor + 5n * TICK, floorPriceQ96: bigFloor },
    ]
    for (const { clearingPriceQ96, floorPriceQ96 } of cases) {
      const maxPrice = bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96, floorPriceQ96, tickSizeQ96: TICK })
      expect(maxPrice <= maxBidPriceUniversalMin).toBe(true)
      if (floorPriceQ96 > CAP) {
        // The cap is unreachable here; the result must still clear the floor grid.
        expect(maxPrice >= floorPriceQ96 + TICK).toBe(true)
      }
    }
  })

  it('rejects malformed price parameters', () => {
    expect(() =>
      bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96: 0n, floorPriceQ96: FLOOR, tickSizeQ96: 0n }),
    ).toThrow()
    expect(() =>
      bidMaxPriceQ96({ chainId: CHAIN, clearingPriceQ96: -1n, floorPriceQ96: FLOOR, tickSizeQ96: TICK }),
    ).toThrow()
  })
})

describe('parseQ96', () => {
  it('parses a decimal Q96 string', () => {
    expect(parseQ96('475368975085586025500', 'floor')).toBe(FLOOR)
    expect(parseQ96('0', 'clearing')).toBe(0n)
  })

  it('throws on missing or non-numeric input', () => {
    expect(() => parseQ96(undefined, 'tick')).toThrow('tick')
    expect(() => parseQ96('0x1', 'tick')).toThrow('tick')
    expect(() => parseQ96('12.3', 'tick')).toThrow('tick')
  })
})
