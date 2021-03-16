import { Fraction, JSBI, Price, Pair } from 'libs/sdk/src'
import { ZERO, ONE } from 'libs/sdk/src/constants'

export function priceRangeCalc(price?: Price | Fraction, amp?: Fraction): [Fraction | undefined, Fraction | undefined] {
  //Ex amp = 1.23456
  if (amp && (amp.equalTo(ONE) || amp?.equalTo(ZERO))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  return [
    (price as Price)?.adjusted.multiply(temp).multiply(temp),
    (price as Price)?.adjusted.divide(temp.multiply(temp))
  ]
}

/**
 * Get health factor (F) of a pool
 */
export function getHealthFactor(pool: Pair): Fraction {
  return pool.reserve0.multiply(pool.reserve1)
}

/**
 * Get yesterday midnight epoch
 *
 * @returns number
 */
export function getYesterdayMidnightEpoch(): number {
  const d = new Date()
  d.setUTCHours(-24, 0, 0, 0) // yesterday midnight in UTC

  return Math.round(d.getTime() / 1000)
}
