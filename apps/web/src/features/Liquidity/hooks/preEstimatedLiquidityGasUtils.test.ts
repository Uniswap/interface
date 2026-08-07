import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  computePreEstimateIndependentAmount,
  DUMMY_AMOUNT,
} from '~/features/Liquidity/hooks/preEstimatedLiquidityGasUtils'

const ETH_MAINNET = nativeOnChain(UniverseChainId.Mainnet)
const WETH = ETH_MAINNET.wrapped

const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4862546267419838844180017', '6661209530036967407', -193981)

describe('computePreEstimateIndependentAmount', () => {
  it('returns a non-dummy amount for a valid range', () => {
    const result = computePreEstimateIndependentAmount({
      poolOrPair: pool,
      tickLower: tickSpaceLimits[0],
      tickUpper: tickSpaceLimits[1],
      token0: WETH,
      token1: USDT,
    })
    expect(result.amountRaw).not.toEqual(DUMMY_AMOUNT)
  })

  it('should fall back to the dummy amount instead of throwing when tickLower equals tickUpper', () => {
    // Repro for ECO-610: min price == max price produces equal ticks; maxLiquidityForAmounts
    // divides by (sqrtRatioB - sqrtRatioA) == 0 and crashed the app from the render path.
    const tick = nearestUsableTick(0, TICK_SPACINGS[FeeAmount.MEDIUM])

    const result = computePreEstimateIndependentAmount({
      poolOrPair: pool,
      tickLower: tick,
      tickUpper: tick,
      token0: WETH,
      token1: USDT,
    })
    expect(result.amountRaw).toEqual(DUMMY_AMOUNT)
  })

  it('should fall back to the dummy amount instead of throwing when ticks are inverted', () => {
    const result = computePreEstimateIndependentAmount({
      poolOrPair: pool,
      tickLower: tickSpaceLimits[1],
      tickUpper: tickSpaceLimits[0],
      token0: WETH,
      token1: USDT,
    })
    expect(result.amountRaw).toEqual(DUMMY_AMOUNT)
  })
})
