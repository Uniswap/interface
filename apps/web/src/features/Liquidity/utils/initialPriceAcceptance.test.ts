import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import {
  exceedsMaxInitialPriceDeviation,
  getInitialPriceChangePercent,
  reapplyRangeToInitialPrice,
} from '~/features/Liquidity/utils/initialPriceAcceptance'

const TICK_SPACING = 60
const LOWEST_TICK = nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING)
const HIGHEST_TICK = nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING)

function state(overrides: Partial<PriceRangeState> = {}): PriceRangeState {
  return {
    priceInverted: false,
    fullRange: false,
    initialPrice: '2000',
    minTick: -1200,
    maxTick: 1200,
    ...overrides,
  }
}

describe('getInitialPriceChangePercent', () => {
  it('returns the signed % move from the reviewed price to the market price', () => {
    expect(getInitialPriceChangePercent({ acceptedPrice: '2000', marketPrice: '2030' })).toBeCloseTo(1.5)
    expect(getInitialPriceChangePercent({ acceptedPrice: '2000', marketPrice: '1970' })).toBeCloseTo(-1.5)
  })

  it.each([
    ['', '2000'],
    ['2000', ''],
    ['0', '2000'],
    ['abc', '2000'],
  ])('is undefined when a price does not parse (%j → %j)', (acceptedPrice, marketPrice) => {
    expect(getInitialPriceChangePercent({ acceptedPrice, marketPrice })).toBeUndefined()
  })
})

describe('exceedsMaxInitialPriceDeviation', () => {
  it.each([
    [undefined, false],
    [0, false],
    [1, false],
    [-1, false],
    [1.01, true],
    [-1.01, true],
  ])('%s%% → %s', (changePercent, expected) => {
    expect(exceedsMaxInitialPriceDeviation(changePercent)).toBe(expected)
  })
})

describe('reapplyRangeToInitialPrice', () => {
  it('moves both edges by the price move in whole tick spacings', () => {
    // +10% is ~953 ticks, which rounds to 16 spacings of 60.
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state(),
      initialPrice: '2200',
      tickSpacing: TICK_SPACING,
    })

    expect(next).toMatchObject({ initialPrice: '2200', minTick: -1200 + 960, maxTick: 1200 + 960 })
  })

  it('moves the edges down when the price falls', () => {
    // -10% is ~-1054 ticks, which rounds to -18 spacings of 60.
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state(),
      initialPrice: '1800',
      tickSpacing: TICK_SPACING,
    })

    expect(next).toMatchObject({ minTick: -1200 - 1080, maxTick: 1200 - 1080 })
  })

  // The ticks are display-oriented like the price, so an inverted pair needs no special casing here.
  it('moves the edges the same way when the price is inverted', () => {
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state({ priceInverted: true, initialPrice: '0.0005' }),
      initialPrice: '0.00055',
      tickSpacing: TICK_SPACING,
    })

    expect(next).toMatchObject({ minTick: -1200 + 960, maxTick: 1200 + 960 })
  })

  it('keeps an edge at the usable tick limit (a 0 or ∞ bound) where it is', () => {
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state({ minTick: LOWEST_TICK, maxTick: 1200 }),
      initialPrice: '2200',
      tickSpacing: TICK_SPACING,
    })

    expect(next).toMatchObject({ minTick: LOWEST_TICK, maxTick: 1200 + 960 })
  })

  it('does not push an edge past the usable tick limit', () => {
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state({ minTick: 0, maxTick: HIGHEST_TICK - 60 }),
      initialPrice: '2200',
      tickSpacing: TICK_SPACING,
    })

    expect(next.maxTick).toBe(HIGHEST_TICK)
  })

  it('only moves the price for a full range or a range not set yet', () => {
    expect(
      reapplyRangeToInitialPrice({
        priceRangeState: state({ fullRange: true }),
        initialPrice: '2200',
        tickSpacing: TICK_SPACING,
      }),
    ).toEqual(state({ fullRange: true, initialPrice: '2200' }))
    expect(
      reapplyRangeToInitialPrice({
        priceRangeState: state({ minTick: undefined, maxTick: undefined }),
        initialPrice: '2200',
        tickSpacing: TICK_SPACING,
      }),
    ).toEqual(state({ minTick: undefined, maxTick: undefined, initialPrice: '2200' }))
  })

  it('leaves the range alone when the move is under half a tick spacing', () => {
    const next = reapplyRangeToInitialPrice({
      priceRangeState: state(),
      initialPrice: '2001',
      tickSpacing: TICK_SPACING,
    })

    expect(next).toEqual(state({ initialPrice: '2001' }))
  })

  it('carries an untouched preset along with the range, but not one the user has edited away from', () => {
    const untouched = reapplyRangeToInitialPrice({
      priceRangeState: state({
        followedPreset: { strategy: DefaultPriceStrategy.STABLE, minTick: -1200, maxTick: 1200 },
      }),
      initialPrice: '2200',
      tickSpacing: TICK_SPACING,
    })
    expect(untouched.followedPreset).toEqual({ strategy: DefaultPriceStrategy.STABLE, minTick: -240, maxTick: 2160 })

    const edited = reapplyRangeToInitialPrice({
      priceRangeState: state({
        followedPreset: { strategy: DefaultPriceStrategy.STABLE, minTick: -600, maxTick: 600 },
      }),
      initialPrice: '2200',
      tickSpacing: TICK_SPACING,
    })
    expect(edited.followedPreset).toEqual({ strategy: DefaultPriceStrategy.STABLE, minTick: -600, maxTick: 600 })
  })
})
