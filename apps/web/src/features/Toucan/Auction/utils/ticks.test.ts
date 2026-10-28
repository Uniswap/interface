import { QUICK_LAUNCH_TOTAL_SUPPLY_RAW } from '@uniswap/liquidity-launcher-sdk'
import { calculateMinValidBidQ96, isBidBelowMinimum, quickLaunchMaxBidFdv, snapToNearestTick } from '@universe/cca'
import { priceToQ96WithDecimals, Q96, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  calculateQuickLaunchMaxBidQ96 as calculateQuickLaunchMaxBidQ96ForChain,
  quickLaunchMaxBidCapQ96,
} from '~/features/Toucan/Auction/utils/ticks'

const MAINNET = 1
const ROBINHOOD = 4663
const ARC = 5042

// The ETH-native cases below run on mainnet; the per-chain block covers Robinhood and Arc.
const QUICK_LAUNCH_MAX_BID_FDV_ETH = quickLaunchMaxBidFdv(MAINNET)
const QUICK_LAUNCH_MAX_BID_PRICE_FDV_CAP_Q96 = quickLaunchMaxBidCapQ96(MAINNET)

function calculateQuickLaunchMaxBidQ96(grid: {
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint {
  return calculateQuickLaunchMaxBidQ96ForChain({ chainId: MAINNET, ...grid })
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

  // There is no grid to place a bid on. Unreachable from the bid form, which only computes the
  // ceiling for a positive tick size.
  it('throws when tickSize is zero', () => {
    expect(() =>
      calculateQuickLaunchMaxBidQ96({
        clearingPriceQ96: 1500n,
        floorPriceQ96: floor,
        tickSizeQ96: 0n,
      }),
    ).toThrow('Invalid auction price parameters for bid')
  })

  // A clearing price read below the floor is a data gap, not a price: the bid still clears the
  // floor grid instead of snapping to a sub-floor price the contract rejects.
  it('stays above the floor when clearing reads below it and the floor exceeds the cap', () => {
    const tick = 4_753_689_750_855_860_255n
    const bigFloor = tick * 2n ** 50n
    expect(calculateQuickLaunchMaxBidQ96({ clearingPriceQ96: 0n, floorPriceQ96: bigFloor, tickSizeQ96: tick })).toBe(
      bigFloor + tick,
    )
  })
})

describe('quick-launch ceiling per chain', () => {
  // A live 4663 grid: floor at exactly 100 ticks.
  const tick = 4_753_689_750_855_860_255n
  const floor = tick * 100n

  it('caps ETH-native chains at 25,000 ETH', () => {
    for (const chainId of [MAINNET, ROBINHOOD]) {
      expect(quickLaunchMaxBidFdv(chainId)).toBe(25_000n)
      expect(quickLaunchMaxBidCapQ96(chainId)).toBe(Q96 / 40_000n)
    }
  })

  // Arc raises in native 18-decimal USDC, where the ETH figure would be a $25k FDV.
  it('caps Arc at 50,000,000 USDC, not 25,000', () => {
    expect(quickLaunchMaxBidFdv(ARC)).toBe(50_000_000n)
    expect(quickLaunchMaxBidCapQ96(ARC)).toBe(Q96 / 20n)
  })

  it('places an Arc quick-launch bid at the Arc cap', () => {
    const arcCap = Q96 / 20n
    const result = calculateQuickLaunchMaxBidQ96ForChain({
      chainId: ARC,
      clearingPriceQ96: floor,
      floorPriceQ96: floor,
      tickSizeQ96: tick,
    })

    expect((result - floor) % tick).toBe(0n)
    expect(result <= arcCap).toBe(true)
    expect(arcCap - result < tick).toBe(true)
    // 2,000× the ETH-denominated ceiling, which would put the bid at a $25k FDV.
    expect(result > quickLaunchMaxBidCapQ96(MAINNET) * 1_999n).toBe(true)
  })
})

describe('quick-launch ceiling display round-trip', () => {
  // The bid-form ceiling peg (useBidFormController) settles on Q96 equality: it writes the
  // formatted ceiling into the field and expects the field's parse → snap pipeline to land
  // exactly back on the ceiling tick. This pins that invariant at realistic Q96 magnitudes.
  it('format → parse → snap lands exactly back on the ceiling tick', () => {
    const bidTokenDecimals = 18
    const auctionTokenDecimals = 18
    const floorPrice = Q96 / 10n ** 6n // 1e-6 bid tokens per auction token
    const tickSize = floorPrice / 100n
    const clearingPrice = floorPrice + 37n * tickSize + tickSize / 3n // off-grid clearing

    const ceiling = calculateQuickLaunchMaxBidQ96({
      clearingPriceQ96: clearingPrice,
      floorPriceQ96: floorPrice,
      tickSizeQ96: tickSize,
    })

    // Format the ceiling the way the controller does...
    const display = q96ToPriceString({ q96Value: ceiling, bidTokenDecimals, auctionTokenDecimals })

    // ...then parse it back the way the field does (decimal string → raw bid-token units → Q96)
    const [whole = '0', frac = ''] = display.split('.')
    const priceRaw = BigInt(whole + frac.padEnd(bidTokenDecimals, '0').slice(0, bidTokenDecimals))
    const parsedQ96 = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })
    const snapped = snapToNearestTick({
      value: parsedQ96,
      floorPrice,
      clearingPrice,
      tickSize,
    })

    expect(snapped).toBe(ceiling)
  })
})
