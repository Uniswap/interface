import { TickMath } from '@uniswap/v3-sdk'
import { getAmount0, getAmount1 } from 'components/Charts/LiquidityChart/utils/getAmounts'
import JSBI from 'jsbi'
import { describe, expect, it } from 'vitest'

describe('getAmount0', () => {
  it('should return full amount when currentTick is below tickLower', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 90
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is below range, position is entirely in token0
    expect(JSBI.greaterThan(result, JSBI.BigInt(0))).toBe(true)
  })

  it('should return partial amount when currentTick is between tickLower and tickUpper', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 105
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const amount0 = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })
    const amount1 = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is in range, position has both token0 and token1
    expect(JSBI.greaterThan(amount0, JSBI.BigInt(0))).toBe(true)
    expect(JSBI.greaterThan(amount1, JSBI.BigInt(0))).toBe(true)
  })

  it('should return zero when currentTick is at or above tickUpper', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 110
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is at or above upper tick, position is entirely in token1
    expect(result.toString()).toBe('0')
  })

  it('should return zero when currentTick is above tickUpper', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 120
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    expect(result.toString()).toBe('0')
  })

  it('should handle zero liquidity', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 105
    const liquidity = JSBI.BigInt(0)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    expect(result.toString()).toBe('0')
  })

  it('should handle real USDC/WETH pool ticks', () => {
    const tickLower = 194810
    const tickUpper = 194820
    const currentTick = 194820
    const liquidity = JSBI.BigInt('1015788607779785415')
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // Result should be a valid JSBI
    expect(JSBI.greaterThanOrEqual(result, JSBI.BigInt(0))).toBe(true)
  })
})

describe('getAmount1', () => {
  it('should return zero when currentTick is below tickLower', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 90
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is below range, position is entirely in token0, no token1
    expect(result.toString()).toBe('0')
  })

  it('should return full amount when currentTick equals tickLower', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 100
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // At tickLower, we get the full range amount
    expect(JSBI.greaterThan(result, JSBI.BigInt(0))).toBe(true)
  })

  it('should return partial amount when currentTick is between tickLower and tickUpper', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 105
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const amount0 = getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })
    const amount1 = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is in range, position has both token0 and token1
    expect(JSBI.greaterThan(amount0, JSBI.BigInt(0))).toBe(true)
    expect(JSBI.greaterThan(amount1, JSBI.BigInt(0))).toBe(true)
  })

  it('should return full amount when currentTick is at or above tickUpper', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 110
    const liquidity = JSBI.BigInt(1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // When current tick is at or above upper tick, position is entirely in token1
    expect(JSBI.greaterThan(result, JSBI.BigInt(0))).toBe(true)
  })

  it('should handle zero liquidity', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 105
    const liquidity = JSBI.BigInt(0)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    expect(result.toString()).toBe('0')
  })

  it('should handle negative liquidity', () => {
    const tickLower = 100
    const tickUpper = 110
    const currentTick = 105
    const liquidity = JSBI.BigInt(-1000000)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // Negative liquidity should be handled (roundUp will be false)
    expect(JSBI.lessThanOrEqual(result, JSBI.BigInt(0))).toBe(true)
  })

  it('should handle real USDC/WETH pool ticks', () => {
    const tickLower = 194810
    const tickUpper = 194820
    const currentTick = 194820
    const liquidity = JSBI.BigInt('1015788607779785415')
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const result = getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 })

    // Result should be a valid JSBI
    expect(JSBI.greaterThan(result, JSBI.BigInt(0))).toBe(true)
  })

  it('should produce more token1 when currentTick is higher in range', () => {
    const tickLower = 100
    const tickUpper = 110
    const liquidity = JSBI.BigInt(1000000)

    // Test at two different points in range
    const currentTick1 = 102
    const currSqrtPriceX96_1 = TickMath.getSqrtRatioAtTick(currentTick1)
    const result1 = getAmount1({
      tickLower,
      tickUpper,
      currentTick: currentTick1,
      liquidity,
      currSqrtPriceX96: currSqrtPriceX96_1,
    })

    const currentTick2 = 108
    const currSqrtPriceX96_2 = TickMath.getSqrtRatioAtTick(currentTick2)
    const result2 = getAmount1({
      tickLower,
      tickUpper,
      currentTick: currentTick2,
      liquidity,
      currSqrtPriceX96: currSqrtPriceX96_2,
    })

    // Higher tick should have more token1
    expect(JSBI.greaterThan(result2, result1)).toBe(true)
  })
})
