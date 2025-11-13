import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TickMath } from '@uniswap/v3-sdk'
import { getAmount0, getAmount1 } from 'components/Charts/LiquidityChart/utils/getAmounts'
import JSBI from 'jsbi'
import { logger } from 'utilities/src/logger/logger'

export function calculateTokensLocked({
  token0,
  token1,
  tickSpacing,
  currentTick,
  amount,
  tick,
}: {
  token0: Currency
  token1: Currency
  tickSpacing: number
  currentTick: number
  amount: JSBI
  tick: { tick: number; liquidityNet: JSBI }
}): { amount0Locked: number; amount1Locked: number } {
  try {
    const tickLower = tick.tick
    const tickUpper = Math.min(TickMath.MAX_TICK, tick.tick + tickSpacing)
    const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick)

    const amount0BigInt = getAmount0({
      tickLower,
      tickUpper,
      currentTick,
      liquidity: amount,
      currSqrtPriceX96,
    })
    const amount1BigInt = getAmount1({
      tickLower,
      tickUpper,
      currentTick,
      liquidity: amount,
      currSqrtPriceX96,
    })

    const amount0Locked = parseFloat(CurrencyAmount.fromRawAmount(token0, amount0BigInt.toString()).toExact())
    const amount1Locked = parseFloat(CurrencyAmount.fromRawAmount(token1, amount1BigInt.toString()).toExact())

    return { amount0Locked, amount1Locked }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'LiquidityChart/utils/calculateTokensLocked.ts', function: 'calculateTokensLocked' },
      extra: { token0, token1, tickSpacing, currentTick, amount, tick },
    })
    return { amount0Locked: 0, amount1Locked: 0 }
  }
}
