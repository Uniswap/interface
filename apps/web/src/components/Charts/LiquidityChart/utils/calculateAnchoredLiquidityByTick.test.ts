import { calculateAnchoredLiquidityByTick } from 'components/Charts/LiquidityChart/utils/calculateAnchoredLiquidityByTick'
import JSBI from 'jsbi'
import { TickProcessed } from 'utils/computeSurroundingTicks'
import { describe, expect, it } from 'vitest'

describe('calculateAnchoredLiquidityByTick', () => {
  it('should calculate anchored liquidity correctly with simple values', () => {
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 100,
        liquidityNet: JSBI.BigInt(1000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
      {
        tick: 110,
        liquidityNet: JSBI.BigInt(2000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
      {
        tick: 120,
        liquidityNet: JSBI.BigInt(3000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
    ]

    const activeTick = 110
    const liquidity = JSBI.BigInt(5000)

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    // Step 1: Cumulative sum
    // tick 100: 1000
    // tick 110: 1000 + 2000 = 3000
    // tick 120: 3000 + 3000 = 6000

    // Step 2: Offset calculation at activeTick (110)
    // rawAtActive = 3000
    // offset = 5000 - 3000 = 2000

    // Step 3: Anchored liquidity
    // tick 100: 1000 + 2000 = 3000
    // tick 110: 3000 + 2000 = 5000
    // tick 120: 6000 + 2000 = 8000

    expect(result.get(100)?.toString()).toBe('3000')
    expect(result.get(110)?.toString()).toBe('5000')
    expect(result.get(120)?.toString()).toBe('8000')
  })

  it('should handle negative liquidityNet values', () => {
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 100,
        liquidityNet: JSBI.BigInt(5000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
      {
        tick: 110,
        liquidityNet: JSBI.BigInt(-2000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
      {
        tick: 120,
        liquidityNet: JSBI.BigInt(1000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
    ]

    const activeTick = 110
    const liquidity = JSBI.BigInt(10000)

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    // Cumulative sum:
    // tick 100: 5000
    // tick 110: 5000 + (-2000) = 3000
    // tick 120: 3000 + 1000 = 4000

    // Offset: 10000 - 3000 = 7000

    // Anchored:
    // tick 100: 5000 + 7000 = 12000
    // tick 110: 3000 + 7000 = 10000
    // tick 120: 4000 + 7000 = 11000

    expect(result.get(100)?.toString()).toBe('12000')
    expect(result.get(110)?.toString()).toBe('10000')
    expect(result.get(120)?.toString()).toBe('11000')
  })

  it('should handle single tick', () => {
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 100,
        liquidityNet: JSBI.BigInt(1000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
    ]

    const activeTick = 100
    const liquidity = JSBI.BigInt(5000)

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    // Cumulative sum: tick 100 = 1000
    // Offset: 5000 - 1000 = 4000
    // Anchored: 1000 + 4000 = 5000

    expect(result.get(100)?.toString()).toBe('5000')
    expect(result.size).toBe(1)
  })

  it('should return empty map for empty ticks array', () => {
    const ticksProcessed: TickProcessed[] = []
    const activeTick = 100
    const liquidity = JSBI.BigInt(5000)

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    expect(result.size).toBe(0)
  })

  it('should handle activeTick not in the ticks array', () => {
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 100,
        liquidityNet: JSBI.BigInt(1000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
      {
        tick: 110,
        liquidityNet: JSBI.BigInt(2000),
        liquidityActive: JSBI.BigInt(0),
      } as TickProcessed,
    ]

    const activeTick = 105 // Not in the array
    const liquidity = JSBI.BigInt(5000)

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    // rawAtActive = 0 (not found)
    // Offset: 5000 - 0 = 5000
    // tick 100: 1000 + 5000 = 6000
    // tick 110: 3000 + 5000 = 8000

    expect(result.get(100)?.toString()).toBe('6000')
    expect(result.get(110)?.toString()).toBe('8000')
  })

  it('should calculate anchored liquidity for USDC/WETH pool', () => {
    // Real data from USDC/WETH pool
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 194810,
        liquidityNet: JSBI.BigInt('1198884537287'),
        liquidityActive: JSBI.BigInt('1015788607779785415'),
      } as TickProcessed,
      {
        tick: 194820,
        liquidityNet: JSBI.BigInt('-3256731548635412'),
        liquidityActive: JSBI.BigInt('1012531876231150003'),
      } as TickProcessed,
      {
        tick: 194830,
        liquidityNet: JSBI.BigInt('195665307069921'),
        liquidityActive: JSBI.BigInt('1012727541538219924'),
      } as TickProcessed,
      {
        tick: 194840,
        liquidityNet: JSBI.BigInt('-1584918636957816'),
        liquidityActive: JSBI.BigInt('1011142622901262108'),
      } as TickProcessed,
    ]

    const activeTick = 194820
    const liquidity = JSBI.BigInt('1012531876231150003')

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    // Verify that the anchored liquidity at activeTick matches the pool liquidity
    expect(result.get(194820)?.toString()).toBe(liquidity.toString())

    // Verify all ticks have anchored values
    expect(result.size).toBe(4)
    expect(result.get(194810)).toBeDefined()
    expect(result.get(194820)).toBeDefined()
    expect(result.get(194830)).toBeDefined()
    expect(result.get(194840)).toBeDefined()

    // Verify the anchored values are JSBI instances
    expect(JSBI.greaterThan(result.get(194810)!, JSBI.BigInt(0))).toBe(true)
    expect(JSBI.greaterThan(result.get(194830)!, JSBI.BigInt(0))).toBe(true)
  })

  it('should maintain liquidity relationships across ticks', () => {
    const ticksProcessed: TickProcessed[] = [
      {
        tick: 194810,
        liquidityNet: JSBI.BigInt('1198884537287'),
        liquidityActive: JSBI.BigInt('1015788607779785415'),
      } as TickProcessed,
      {
        tick: 194820,
        liquidityNet: JSBI.BigInt('-3256731548635412'),
        liquidityActive: JSBI.BigInt('1012531876231150003'),
      } as TickProcessed,
    ]

    const activeTick = 194820
    const liquidity = JSBI.BigInt('1012531876231150003')

    const result = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })

    const liq194810 = result.get(194810)!
    const liq194820 = result.get(194820)!
    const netChange = JSBI.BigInt('-3256731548635412')

    // Verify: liq194820 = liq194810 + netChange
    const calculated = JSBI.add(liq194810, netChange)
    expect(calculated.toString()).toBe(liq194820.toString())
  })
})
