import { Fraction, JSBI } from 'libs/sdk/src'

export function priceRangeCalc(price?: Fraction, amp?: Fraction): [Fraction | undefined, Fraction | undefined] {
  if (amp && amp.equalTo(JSBI.BigInt(1))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  return [
    temp.multiply(temp).multiply(price),
    new Fraction(JSBI.BigInt(1), JSBI.BigInt(1)).divide(temp.multiply(temp)).multiply(price)
  ]
}
