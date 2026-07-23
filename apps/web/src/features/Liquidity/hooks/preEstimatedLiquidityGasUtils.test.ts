import { FeeAmount, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { DAI } from 'uniswap/src/constants/tokens'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { describe, expect, it } from 'vitest'
import {
  computePreEstimateIndependentAmount,
  DUMMY_AMOUNT,
} from '~/features/Liquidity/hooks/preEstimatedLiquidityGasUtils'

const ONE_UNIT = '1000000000000000000'
const SQRT_PRICE_1_1 = TickMath.getSqrtRatioAtTick(0)

// Pool at tick 0
const pool = new V3Pool(WETH, DAI, FeeAmount.MEDIUM, SQRT_PRICE_1_1, ONE_UNIT, 0)

describe('computePreEstimateIndependentAmount', () => {
  it('returns a non-dummy amount for a valid range', () => {
    const result = computePreEstimateIndependentAmount({
      poolOrPair: pool,
      tickLower: -600,
      tickUpper: 600,
      token0: pool.token0,
      token1: pool.token1,
    })
    expect(result.amountRaw).not.toBe(DUMMY_AMOUNT)
  })

  it.each([
    ['equal ticks above current tick', 600, 600],
    ['equal ticks below current tick', -600, -600],
    ['inverted ticks', 600, -600],
  ])('falls back to DUMMY_AMOUNT instead of throwing for %s', (_case, tickLower, tickUpper) => {
    const result = computePreEstimateIndependentAmount({
      poolOrPair: pool,
      tickLower,
      tickUpper,
      token0: pool.token0,
      token1: pool.token1,
    })
    expect(result.amountRaw).toBe(DUMMY_AMOUNT)
  })
})
