import { BigNumber, BigNumberish, FixedNumber } from 'ethers'

export function isZero(n: BigNumberish) {
  return BigNumber.from(n).isZero()
}

export function isValidNumber(n: any) {
  // is not NaN: `NaN === NaN` => `false`
  // eslint-disable-next-line no-self-compare
  return typeof n === 'number' && n === n
}

export function fixedNumberToInt(n: FixedNumber, roundUp = true) {
  const rounded = roundUp ? n.ceiling() : n.floor()
  // The FixedNumber interface isn't very friendly, need to strip out the decimal manually
  return rounded.toString().split('.')[0]
}
