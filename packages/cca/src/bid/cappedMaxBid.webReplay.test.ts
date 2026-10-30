import { describe, expect, it } from 'vitest'
import { calculateCappedMaxBidQ96, fdvToPriceQ96 } from './cappedMaxBid'
import { calculateMinValidBidQ96, isBidBelowMinimum, Q96 } from './ticks'

// Replayed from apps/web's Toucan ticks.test.ts (the quick-launch ceiling cases), against
// `calculateCappedMaxBidQ96` at web's hard-coded 25,000-native-unit cap. Bodies are unchanged; one
// case is moved to the disagreement block at the bottom because the two apps answer it differently.
const QUICK_LAUNCH_TOTAL_SUPPLY_RAW = 10n ** 27n
const QUICK_LAUNCH_MAX_BID_FDV_ETH = 25_000n
const QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 = fdvToPriceQ96({
  fdvRaw: QUICK_LAUNCH_MAX_BID_FDV_ETH * 10n ** 18n,
  totalSupplyRaw: QUICK_LAUNCH_TOTAL_SUPPLY_RAW,
})

function calculateQuickLaunchMaxBidQ96(grid: {
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint {
  return calculateCappedMaxBidQ96({ capQ96: QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96, ...grid })
}

describe('QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96', () => {
  it('is the 25,000 ETH FDV spread over the preset supply, floored, = 2^96 / 40,000', () => {
    // 25_000 ETH-wei FDV / 1e27 raw supply = 2.5e-5 ETH-wei per token-wei.
    expect(QUICK_LAUNCH_MAX_BID_FDV_ETH).toBe(25_000n)
    expect(QUICK_LAUNCH_TOTAL_SUPPLY_RAW).toBe(10n ** 27n)
    expect(QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(Q96 / 40_000n)
    expect(QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(1_980_704_062_856_608_439_838_598n)
  })

  it('round-trips back to the intended FDV within integer-floor loss', () => {
    const fdvWei = (QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 * QUICK_LAUNCH_TOTAL_SUPPLY_RAW) / Q96
    const targetWei = QUICK_LAUNCH_MAX_BID_FDV_ETH * 10n ** 18n
    expect(fdvWei <= targetWei).toBe(true)
    // The cap's integer floor costs at most 1 wei of the 2.5e22-wei target FDV.
    expect(targetWei - fdvWei <= 1n).toBe(true)
  })

  it('sits far above the quick-launch preset floor', () => {
    // The preset floor is a ~$1k FDV (0.4 ETH at the $2.5k/ETH fallback): floorQ96 =
    // 0.4e18 × 2^96 / 1e27. The 25,000 ETH cap is 62,500× that — ordinary bids never hit the
    // minValid clamp.
    const presetFloorQ96 = (4n * 10n ** 17n * Q96) / QUICK_LAUNCH_TOTAL_SUPPLY_RAW
    expect(QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 > presetFloorQ96 * 1_000n).toBe(true)
  })
})

describe('calculateQuickLaunchMaxBidQ96', () => {
  const floor = 1000n
  const tickSize = 100n

  it('snaps the FDV cap down onto the floor-anchored tick grid', () => {
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: floor,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    // On the grid, within one tick below the cap (never above — snapping up would overshoot the
    // 25,000 ETH FDV product cap), and strictly above clearing.
    expect((result - floor) % tickSize).toBe(0n)
    expect(result <= QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(true)
    expect(QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 - result < tickSize).toBe(true)
    expect(result > floor).toBe(true)
  })

  it('is always strictly above the clearing price (contract requirement)', () => {
    const clearing = 1150n
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: clearing,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result > clearing).toBe(true)
    expect(
      isBidBelowMinimum({
        bidPriceQ96: result,
        clearingPriceQ96: clearing,
        floorPriceQ96: floor,
        tickSizeQ96: tickSize,
      }),
    ).toBe(false)
  })

  it('does not move with the clearing price while below the cap (the old 50x ceiling did)', () => {
    const atFloor = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: floor,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    // Clearing at 200x the floor — beyond the old multiple, which would have capped the
    // submitted maxPrice below a later clearing and silently dropped the bid; the fixed cap
    // keeps it included.
    const bidUp = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: floor * 200n,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(bidUp).toBe(atFloor)
    expect(bidUp > floor * 200n).toBe(true)
  })

  it('clamps up to the minimum valid bid when clearing already implies an FDV above the cap', () => {
    // Clearing one tick past the cap: the snapped cap is no longer strictly above clearing, so
    // the bid goes in minimally-above-clearing instead of failing (the stated clamp semantics).
    const cappedTicks = (QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 - floor) / tickSize
    const clearing = floor + (cappedTicks + 1n) * tickSize
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: clearing,
      floorPriceQ96: floor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(
      calculateMinValidBidQ96({ clearingPriceQ96: clearing, floorPriceQ96: floor, tickSizeQ96: tickSize }),
    )
    expect(result).toBe(clearing + tickSize)
    expect(result > QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(true)
  })

  it('never returns below the contract minimum valid bid', () => {
    // Floor above the cap: grid snapping can't reach the target, so the minimum-valid clamp
    // (first tick strictly above clearing) takes over.
    const bigFloor = tickSize * 2n ** 80n
    expect(bigFloor > QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(true)
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: bigFloor,
      floorPriceQ96: bigFloor,
      tickSizeQ96: tickSize,
    })
    expect(result).toBe(
      calculateMinValidBidQ96({ clearingPriceQ96: bigFloor, floorPriceQ96: bigFloor, tickSizeQ96: tickSize }),
    )
    expect(result).toBe(bigFloor + tickSize)
  })

  it('clamps to the minimum valid bid when the tick grid is too coarse to express the cap', () => {
    // Tick size exceeds cap − floor: the snap truncates to the floor, so the minValid clamp
    // yields the one-tick-above-clearing ceiling — which may exceed the cap (the contract
    // requires strictly-above-clearing).
    const coarseTick = QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96
    expect(coarseTick > QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 - floor).toBe(true)
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: floor,
      floorPriceQ96: floor,
      tickSizeQ96: coarseTick,
    })
    expect(result).toBe(
      calculateMinValidBidQ96({ clearingPriceQ96: floor, floorPriceQ96: floor, tickSizeQ96: coarseTick }),
    )
    expect(result).toBe(floor + coarseTick)
    expect(result > QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96).toBe(true)
  })

  it('clamps to the minimum valid bid on a degenerate zero floor', () => {
    const result = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: 0n,
      floorPriceQ96: 0n,
      tickSizeQ96: QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 * 2n,
    })
    expect(result).toBe(QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 * 2n)
  })
})

/**
 * Where apps/web's original `calculateQuickLaunchMaxBidQ96` and apps/pools-xyz's `bidMaxPriceQ96`
 * (this package's `calculateCappedMaxBidQ96`) disagreed at the same cap. Every input with
 * clearing >= floor >= 0 and a positive tick agrees; only degenerate grids differ. Web now uses this
 * function, so these pin the answer both apps give.
 */
describe('calculateCappedMaxBidQ96 vs the web quick-launch ceiling', () => {
  // Web: returns the cap itself (QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96). Unreachable from the web
  // bid form, whose controller only computes the ceiling for a truthy (non-zero) tick size.
  it('throws on a zero tick size, where web returned the cap', () => {
    expect(() =>
      calculateQuickLaunchMaxBidQ96({ clearingPriceQ96: 1500n, floorPriceQ96: 1000n, tickSizeQ96: 0n }),
    ).toThrow('Invalid auction price parameters for bid')
  })

  // Web: 1980705647419858724870085 — one tick past the cap and far BELOW the floor, which the
  // contract rejects. Needs a clearing price below the floor, which on-chain clearing never is.
  it('stays above the floor when clearing reads below it and the floor exceeds the cap', () => {
    const tick = 4_753_689_750_855_860_255n
    const floor = tick * 2n ** 50n
    expect(calculateQuickLaunchMaxBidQ96({ clearingPriceQ96: 0n, floorPriceQ96: floor, tickSizeQ96: tick })).toBe(
      floor + tick,
    )
  })

  // Web: computes a price (1980700893730107869009830 for clearing -1 on the 4663 preset grid).
  it('throws on a negative price, where web computed one', () => {
    const tick = 4_753_689_750_855_860_255n
    expect(() =>
      calculateQuickLaunchMaxBidQ96({ clearingPriceQ96: -1n, floorPriceQ96: tick * 100n, tickSizeQ96: tick }),
    ).toThrow('Invalid auction price parameters for bid')
  })
})
