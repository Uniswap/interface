import { Fraction, JSBI, Price } from 'libs/sdk/src'

export function priceRangeCalc(price?: Price | Fraction, amp?: Fraction): [Fraction | undefined, Fraction | undefined] {
  if (amp && amp.equalTo(JSBI.BigInt(1))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  return [
    (price as Price)?.adjusted.multiply(temp).multiply(temp),
    (price as Price)?.adjusted.divide(temp.multiply(temp))
  ]
}
