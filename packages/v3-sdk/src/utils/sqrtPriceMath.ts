import { MaxUint256 } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { ONE, Q96, ZERO } from '../internalConstants'
import { FullMath } from './fullMath'

const MaxUint160 = JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(160)), ONE)

function multiplyIn256(x: JSBI, y: JSBI): JSBI {
  const product = JSBI.multiply(x, y)
  return JSBI.bitwiseAnd(product, MaxUint256)
}

function addIn256(x: JSBI, y: JSBI): JSBI {
  const sum = JSBI.add(x, y)
  return JSBI.bitwiseAnd(sum, MaxUint256)
}

export abstract class SqrtPriceMath {
  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static getAmount0Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    }

    const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96))
    const numerator2 = JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)

    return roundUp
      ? FullMath.mulDivRoundingUp(FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), ONE, sqrtRatioAX96)
      : JSBI.divide(JSBI.divide(JSBI.multiply(numerator1, numerator2), sqrtRatioBX96), sqrtRatioAX96)
  }

  public static getAmount1Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    }

    return roundUp
      ? FullMath.mulDivRoundingUp(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96), Q96)
      : JSBI.divide(JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)), Q96)
  }

  public static getNextSqrtPriceFromInput(sqrtPX96: JSBI, liquidity: JSBI, amountIn: JSBI, zeroForOne: boolean): JSBI {
    invariant(JSBI.greaterThan(sqrtPX96, ZERO))
    invariant(JSBI.greaterThan(liquidity, ZERO))

    return zeroForOne
      ? this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
      : this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true)
  }

  public static getNextSqrtPriceFromOutput(
    sqrtPX96: JSBI,
    liquidity: JSBI,
    amountOut: JSBI,
    zeroForOne: boolean
  ): JSBI {
    invariant(JSBI.greaterThan(sqrtPX96, ZERO))
    invariant(JSBI.greaterThan(liquidity, ZERO))

    return zeroForOne
      ? this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
      : this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false)
  }

  private static getNextSqrtPriceFromAmount0RoundingUp(
    sqrtPX96: JSBI,
    liquidity: JSBI,
    amount: JSBI,
    add: boolean
  ): JSBI {
    if (JSBI.equal(amount, ZERO)) return sqrtPX96
    const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96))

    if (add) {
      const product = multiplyIn256(amount, sqrtPX96)
      if (JSBI.equal(JSBI.divide(product, amount), sqrtPX96)) {
        const denominator = addIn256(numerator1, product)
        if (JSBI.greaterThanOrEqual(denominator, numerator1)) {
          return FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator)
        }
      }

      return FullMath.mulDivRoundingUp(numerator1, ONE, JSBI.add(JSBI.divide(numerator1, sqrtPX96), amount))
    } else {
      const product = multiplyIn256(amount, sqrtPX96)

      invariant(JSBI.equal(JSBI.divide(product, amount), sqrtPX96))
      invariant(JSBI.greaterThan(numerator1, product))
      const denominator = JSBI.subtract(numerator1, product)
      return FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator)
    }
  }

  private static getNextSqrtPriceFromAmount1RoundingDown(
    sqrtPX96: JSBI,
    liquidity: JSBI,
    amount: JSBI,
    add: boolean
  ): JSBI {
    if (add) {
      const quotient = JSBI.lessThanOrEqual(amount, MaxUint160)
        ? JSBI.divide(JSBI.leftShift(amount, JSBI.BigInt(96)), liquidity)
        : JSBI.divide(JSBI.multiply(amount, Q96), liquidity)

      return JSBI.add(sqrtPX96, quotient)
    } else {
      const quotient = FullMath.mulDivRoundingUp(amount, Q96, liquidity)

      invariant(JSBI.greaterThan(sqrtPX96, quotient))
      return JSBI.subtract(sqrtPX96, quotient)
    }
  }
}
