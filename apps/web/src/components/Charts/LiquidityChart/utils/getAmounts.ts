import { SqrtPriceMath, TickMath } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

type GetAmountParams = {
  tickLower: number
  tickUpper: number
  currentTick: number
  liquidity: JSBI
  currSqrtPriceX96: JSBI
}

/**
 * Calculates the amount of token0 locked in a liquidity position defined by tick boundaries.
 *
 * Uses Uniswap v3/v4 math via SqrtPriceMath.getAmount0Delta to compute token amounts based
 * on the position's tick range relative to the current tick. The calculation depends on
 * whether the current price is below, within, or above the position's range.
 *
 * IMPORTANT: The liquidity parameter must be the anchored active liquidity from the three-step
 * anchoring process (see useLiquidityBarData). Using unanchored values from computeSurroundingTicks
 * will produce incorrect amounts.
 *
 * Example:
 * - tickLower = 100, tickUpper = 110, currTick = 105
 * - liquidity = 50000 (anchored via offset calculation)
 * - Since currTick (105) is between tickLower and tickUpper:
 *   amount0 = liquidity * (sqrtPriceUpper - currSqrtPrice) / (sqrtPriceUpper * currSqrtPrice)
 *
 * @param params.tickLower - Lower tick boundary of the position
 * @param params.tickUpper - Upper tick boundary of the position
 * @param params.currentTick - Current pool tick
 * @param params.liquidity - Anchored active liquidity at the tick boundary
 * @param params.currSqrtPriceX96 - Current pool sqrt price in Q96 format
 * @returns Token0 amount in raw units (convert via CurrencyAmount.fromRawAmount)
 */
export function getAmount0({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 }: GetAmountParams): JSBI {
  const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)

  let amount0 = JSBI.BigInt(0)
  const roundUp = JSBI.greaterThan(liquidity, JSBI.BigInt(0))

  if (currentTick <= tickLower) {
    amount0 = SqrtPriceMath.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp)
  } else if (currentTick < tickUpper) {
    amount0 = SqrtPriceMath.getAmount0Delta(currSqrtPriceX96, sqrtRatioBX96, liquidity, roundUp)
  }
  return amount0
}

/**
 * Calculates the amount of token1 locked in a liquidity position defined by tick boundaries.
 *
 * Uses Uniswap v3/v4 math via SqrtPriceMath.getAmount1Delta to compute token amounts based
 * on the position's tick range relative to the current tick. The calculation has four branches
 * depending on whether the current price is below, at, within, or above the position's range.
 *
 * IMPORTANT: The liquidity parameter must be the anchored active liquidity from the three-step
 * anchoring process (see useLiquidityBarData). Using unanchored values from computeSurroundingTicks
 * will produce incorrect amounts.
 *
 * Example:
 * - tickLower = 100, tickUpper = 110, currTick = 105
 * - liquidity = 50000 (anchored via offset calculation)
 * - Since currTick (105) is between tickLower and tickUpper:
 *   amount1 = liquidity * (currSqrtPrice - sqrtPriceLower) / (sqrtPriceLower * currSqrtPrice)
 *
 * @param params.tickLower - Lower tick boundary of the position
 * @param params.tickUpper - Upper tick boundary of the position
 * @param params.currentTick - Current pool tick
 * @param params.liquidity - Anchored active liquidity at the tick boundary
 * @param params.currSqrtPriceX96 - Current pool sqrt price in Q96 format
 * @returns Token1 amount in raw units (convert via CurrencyAmount.fromRawAmount)
 */
export function getAmount1({ tickLower, tickUpper, currentTick, liquidity, currSqrtPriceX96 }: GetAmountParams): JSBI {
  const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
  const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)
  let amount1 = JSBI.BigInt(0)
  const roundUp = JSBI.greaterThan(liquidity, JSBI.BigInt(0))

  if (currentTick < tickLower) {
    amount1 = JSBI.BigInt(0)
  } else if (currentTick === tickLower) {
    amount1 = SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp)
  } else if (currentTick < tickUpper) {
    amount1 = SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, currSqrtPriceX96, liquidity, roundUp)
  } else {
    amount1 = SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp)
  }
  return amount1
}
