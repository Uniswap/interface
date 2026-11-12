import { Token } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { describe, expect, it } from 'vitest'
import { buildSegmentsFromRawTicks } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import { priceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import {
  buildV2SyntheticPool,
  buildV2SyntheticTicksProcessed,
  V2_SYNTHETIC_BUCKETS_PER_SIDE,
  V2_SYNTHETIC_TICK_SPACING,
} from '~/features/Liquidity/utils/v2SyntheticTicks'

const TOKEN_18 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'T18')
const TOKEN_18_B = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'T18B')
const TOKEN_6 = new Token(1, '0x0000000000000000000000000000000000000003', 6, 'T6')

function build(reserve0: number, reserve1: number, token0 = TOKEN_18, token1 = TOKEN_18_B) {
  return buildV2SyntheticPool({ reserves: { reserve0, reserve1 }, token0, token1 })
}

describe('buildV2SyntheticPool', () => {
  it('derives L = sqrt(x·y) in raw base units and the tick from the raw reserve ratio', () => {
    const pool = build(1000, 2000)

    // sqrt(1000e18 · 2000e18) = sqrt(2)·1e21, floored.
    expect(pool?.liquidity.toString()).toBe('1414213562373095048801')
    // floor(ln(2) / ln(1.0001))
    expect(pool?.currentTick).toBe(6931)
    expect(pool?.tickSpacing).toBe(V2_SYNTHETIC_TICK_SPACING)
    expect(pool?.activeTick).toBe(6900)
  })

  it('produces a tick that round-trips back to the reserve ratio through priceFromTick', () => {
    const pool = build(1000, 2000)
    const tick = pool?.currentTick as number

    const price = priceFromTick({ tick, token0Decimals: 18, token1Decimals: 18 })
    expect(price).toBeCloseTo(2, 2)

    // getTickAtSqrtRatio floors, so the ratio sits in [price(tick), price(tick + 1)).
    expect(price).toBeLessThanOrEqual(2)
    expect(priceFromTick({ tick: tick + 1, token0Decimals: 18, token1Decimals: 18 })).toBeGreaterThan(2)
  })

  it('scales each reserve by its own decimals (18/6 pair)', () => {
    // 1 TOKEN_18 against 3000 TOKEN_6 — a decimal-adjusted price of 3000 token1 per token0.
    const pool = build(1, 3000, TOKEN_18, TOKEN_6)

    // sqrt(1e18 · 3e9) = sqrt(3)·1e13.5, floored.
    expect(pool?.liquidity.toString()).toBe('54772255750516')
    expect(pool?.currentTick).toBe(-196257)

    const price = priceFromTick({ tick: pool?.currentTick as number, token0Decimals: 18, token1Decimals: 6 })
    expect(price / 3000).toBeCloseTo(1, 3)
  })

  it('is symmetric under swapping the reserves — the tick flips sign, L does not', () => {
    const pool = build(1000, 2000)
    const flipped = build(2000, 1000)

    expect(flipped?.liquidity.toString()).toBe(pool?.liquidity.toString())
    // Both ticks floor away from zero-crossing, so the flipped tick is -(tick + 1).
    expect(flipped?.currentTick).toBe(-(pool?.currentTick as number) - 1)
  })

  it('returns the full range as two raw ticks that collapse to a single segment', () => {
    const pool = build(1000, 2000)
    const rawTicks = pool?.rawTicks ?? []

    const minTick = nearestUsableTick(TickMath.MIN_TICK, V2_SYNTHETIC_TICK_SPACING)
    const maxTick = nearestUsableTick(TickMath.MAX_TICK, V2_SYNTHETIC_TICK_SPACING)
    expect(rawTicks.map((t) => t.tick)).toEqual([minTick, maxTick])

    const segments = buildSegmentsFromRawTicks(rawTicks)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toEqual({
      startTick: minTick,
      endTick: maxTick,
      liquidityActive: BigInt(pool?.liquidity.toString() as string),
    })
  })

  it('handles a wildly lopsided pool without throwing', () => {
    const pool = build(1e-6, 1e12)

    expect(pool).toBeDefined()
    expect(JSBI.greaterThan(pool?.liquidity as JSBI, JSBI.BigInt(0))).toBe(true)
    expect(pool?.currentTick).toBeGreaterThan(0)
    expect(pool?.currentTick).toBeLessThan(TickMath.MAX_TICK)
  })

  it('returns undefined when a reserve is zero, missing or non-finite', () => {
    expect(build(0, 2000)).toBeUndefined()
    expect(build(1000, 0)).toBeUndefined()
    expect(build(NaN, 2000)).toBeUndefined()
    expect(buildV2SyntheticPool({ reserves: undefined, token0: TOKEN_18, token1: TOKEN_18_B })).toBeUndefined()
  })

  it('returns undefined when the reserve ratio falls outside the representable tick range', () => {
    // One raw unit of token0 against 1e39 raw units of token1 — a ratio past MAX_SQRT_RATIO.
    expect(build(1e-18, 1e21)).toBeUndefined()
  })
})

describe('buildV2SyntheticTicksProcessed', () => {
  it('spreads a uniform L across evenly spaced buckets centred on the active tick', () => {
    const pool = build(1000, 2000)
    const ticks = buildV2SyntheticTicksProcessed({ pool: pool!, token0: TOKEN_18, token1: TOKEN_18_B })

    expect(ticks).toHaveLength(V2_SYNTHETIC_BUCKETS_PER_SIDE * 2 + 1)
    expect(ticks.map((t) => t.tick)).toContain(pool?.activeTick)
    expect(ticks[1].tick - ticks[0].tick).toBe(V2_SYNTHETIC_TICK_SPACING)

    // Uniform liquidity, no initialized ticks anywhere in the range.
    expect(new Set(ticks.map((t) => t.liquidityActive.toString())).size).toBe(1)
    expect(ticks[0].liquidityActive.toString()).toBe(pool?.liquidity.toString())
    expect(ticks.every((t) => JSBI.equal(t.liquidityNet, JSBI.BigInt(0)))).toBe(true)
  })

  it('spans at least ±50% around the mid price, the band the depth chart and order book display', () => {
    const pool = build(1000, 2000)
    const ticks = buildV2SyntheticTicksProcessed({ pool: pool!, token0: TOKEN_18, token1: TOKEN_18_B })

    const priceAt = (tick: number) => priceFromTick({ tick, token0Decimals: 18, token1Decimals: 18 })
    const midPrice = priceAt(pool?.activeTick as number)
    const bucketTicks = ticks.map((t) => t.tick)

    // v2 has liquidity at every price, so a window narrower than the band the charts render would
    // truncate the depth ramp mid-slope and read as "liquidity ends here".
    expect(priceAt(Math.min(...bucketTicks)) / midPrice).toBeLessThanOrEqual(0.5)
    expect(priceAt(Math.max(...bucketTicks)) / midPrice).toBeGreaterThanOrEqual(1.5)

    // Every bucket stays on the tick-spacing grid the x-scale and active-bucket floor division key off.
    expect(bucketTicks.every((tick) => tick % V2_SYNTHETIC_TICK_SPACING === 0)).toBe(true)
  })

  it('prices every bucket consistently with its tick', () => {
    const pool = build(1, 3000, TOKEN_18, TOKEN_6)
    const ticks = buildV2SyntheticTicksProcessed({ pool: pool!, token0: TOKEN_18, token1: TOKEN_6 })

    for (const t of ticks) {
      const expected = priceFromTick({ tick: t.tick, token0Decimals: 18, token1Decimals: 6 })
      expect(Number(t.price0) / expected).toBeCloseTo(1, 3)
    }
  })

  it('clamps buckets to the usable tick range near the edge of the price space', () => {
    const pool = build(1e-6, 1e12)
    const ticks = buildV2SyntheticTicksProcessed({ pool: pool!, token0: TOKEN_18, token1: TOKEN_18_B })

    const maxTick = nearestUsableTick(TickMath.MAX_TICK, V2_SYNTHETIC_TICK_SPACING)
    expect(ticks.length).toBeGreaterThan(0)
    expect(Math.max(...ticks.map((t) => t.tick))).toBeLessThanOrEqual(maxTick)
  })
})
