import {
  calculateMaxValidBidQ96,
  calculateMinValidBidQ96,
  isBidBelowMinimum,
  isMaxBidPriceReached,
  snapToNearestTick,
} from './ticks'

// Replayed from apps/web's Toucan ticks.test.ts with only this import block changed: every case
// below is byte-for-byte the suite that pinned the web behavior.

describe('calculateMinValidBidQ96', () => {
  // Using simple numbers for readability: floor=1000, tickSize=100
  const floor = 1000n
  const tickSize = 100n

  it('returns floor + 1 tick when clearing price equals floor (auction start)', () => {
    // Clearing @ 1000 → min bid = 1100
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: floor,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(1100n)
  })

  it('returns next tick above when clearing price is between ticks', () => {
    // Clearing @ 1150 → min bid = 1200
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: 1150n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(1200n)
  })

  it('returns clearing + 1 tick when clearing price is exactly at a tick boundary', () => {
    // Clearing @ 1200 → min bid = 1300 (must be strictly above)
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: 1200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('handles clearing price just below a tick boundary', () => {
    // Clearing @ 1199 → min bid = 1200
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: 1199n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(1200n)
  })

  it('handles clearing price just above a tick boundary', () => {
    // Clearing @ 1201 → min bid = 1300
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: 1201n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('returns clearingPrice + 1 when tickSize is zero or negative', () => {
    const result = calculateMinValidBidQ96({
      clearingPriceQ96: 1500n,
      floorPriceQ96: floor,
      tickSizeQ96: 0n,
    })
    expect(result).toBe(1501n)
  })
})

describe('isBidBelowMinimum', () => {
  const floor = 1000n
  const tickSize = 100n

  it('returns true for bid at clearing price (not strictly above)', () => {
    // Clearing @ 1200, bid @ 1200 → invalid (must be strictly above)
    const result = isBidBelowMinimum({
      bidPriceQ96: 1200n,
      clearingPriceQ96: 1200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(true)
  })

  it('returns true for bid below minimum valid tick', () => {
    // Clearing @ 1200, min valid = 1300, bid @ 1250 → invalid
    const result = isBidBelowMinimum({
      bidPriceQ96: 1250n,
      clearingPriceQ96: 1200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(true)
  })

  it('returns false for bid at minimum valid tick', () => {
    // Clearing @ 1200, min valid = 1300, bid @ 1300 → valid
    const result = isBidBelowMinimum({
      bidPriceQ96: 1300n,
      clearingPriceQ96: 1200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(false)
  })

  it('returns false for bid above minimum valid tick', () => {
    // Clearing @ 1200, min valid = 1300, bid @ 1400 → valid
    const result = isBidBelowMinimum({
      bidPriceQ96: 1400n,
      clearingPriceQ96: 1200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(false)
  })
})

describe('snapToNearestTick', () => {
  const floor = 1000n
  const tickSize = 100n

  it('returns value unchanged if already on a valid tick', () => {
    // Value @ 1300, clearing @ 1100 → snaps to 1300
    const result = snapToNearestTick({
      value: 1300n,
      floorPrice: floor,
      clearingPrice: 1100n,
      tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('rounds to nearest tick (round down)', () => {
    // Value @ 1340, clearing @ 1100 → snaps to 1300
    const result = snapToNearestTick({
      value: 1340n,
      floorPrice: floor,
      clearingPrice: 1100n,
      tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('rounds to nearest tick (round up)', () => {
    // Value @ 1360, clearing @ 1100 → snaps to 1400
    const result = snapToNearestTick({
      value: 1360n,
      floorPrice: floor,
      clearingPrice: 1100n,
      tickSize,
    })
    expect(result).toBe(1400n)
  })

  it('snaps to minimum valid bid when value is below clearing price', () => {
    // Value @ 1050, clearing @ 1200 → min valid = 1300, snaps to 1300
    const result = snapToNearestTick({
      value: 1050n,
      floorPrice: floor,
      clearingPrice: 1200n,
      tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('snaps to minimum valid bid when snapped value would be at clearing price', () => {
    // Value @ 1200, clearing @ 1200 → snaps to 1200 but must be > clearing, so 1300
    const result = snapToNearestTick({
      value: 1200n,
      floorPrice: floor,
      clearingPrice: 1200n,
      tickSize,
    })
    expect(result).toBe(1300n)
  })

  it('returns value unchanged when tickSize is zero', () => {
    const result = snapToNearestTick({
      value: 1234n,
      floorPrice: floor,
      clearingPrice: 1100n,
      tickSize: 0n,
    })
    expect(result).toBe(1234n)
  })
})

describe('calculateMaxValidBidQ96', () => {
  const floor = 1000n
  const tickSize = 100n

  it('returns the ceiling itself when it lands exactly on a tick', () => {
    expect(calculateMaxValidBidQ96({ maxBidPriceQ96: 1500n, floorPriceQ96: floor, tickSizeQ96: tickSize })).toBe(1500n)
  })

  it('rounds DOWN to the tick below when the ceiling sits between ticks', () => {
    // Rounding up to 1600 would exceed the hook's limit and revert.
    expect(calculateMaxValidBidQ96({ maxBidPriceQ96: 1599n, floorPriceQ96: floor, tickSizeQ96: tickSize })).toBe(1500n)
  })

  it('returns the floor when the ceiling is under the first tick above it', () => {
    expect(calculateMaxValidBidQ96({ maxBidPriceQ96: 1099n, floorPriceQ96: floor, tickSizeQ96: tickSize })).toBe(floor)
  })

  it('returns undefined when the ceiling is below the floor price', () => {
    // Guards BigInt truncation-toward-zero, which would otherwise report the floor
    // itself (above the ceiling) as valid.
    expect(
      calculateMaxValidBidQ96({ maxBidPriceQ96: 999n, floorPriceQ96: floor, tickSizeQ96: tickSize }),
    ).toBeUndefined()
  })

  it('returns the raw ceiling when tick size is non-positive', () => {
    expect(calculateMaxValidBidQ96({ maxBidPriceQ96: 1599n, floorPriceQ96: floor, tickSizeQ96: 0n })).toBe(1599n)
  })
})

describe('isMaxBidPriceReached', () => {
  const floor = 1000n
  const tickSize = 100n

  it('is false at auction start with headroom under the ceiling', () => {
    // clearing @ floor → min valid bid 1100, ceiling tick 1500
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: floor,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 1500n,
      }),
    ).toBe(false)
  })

  it('is false while exactly one valid tick remains', () => {
    // clearing @ 1400 → min valid bid 1500, which is still the ceiling tick
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: 1400n,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 1500n,
      }),
    ).toBe(false)
  })

  it('is true once clearing reaches the last tick under the ceiling', () => {
    // clearing @ 1500 → min valid bid 1600 > ceiling tick 1500
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: 1500n,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 1500n,
      }),
    ).toBe(true)
  })

  it('is true when clearing has passed the ceiling entirely', () => {
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: 2000n,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 1500n,
      }),
    ).toBe(true)
  })

  it('is true when the ceiling is below the floor price', () => {
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: floor,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 999n,
      }),
    ).toBe(true)
  })

  it('does not fire merely because the ceiling is between ticks', () => {
    // Ceiling 1649 rounds down to 1600; clearing @ 1400 leaves 1500 and 1600 open.
    expect(
      isMaxBidPriceReached({
        clearingPriceQ96: 1400n,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
        maxBidPriceQ96: 1649n,
      }),
    ).toBe(false)
  })
})
