import { Fraction, JSBI, Price } from 'libs/sdk/src'
import { ONE, ZERO } from 'libs/sdk/src/constants'

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
