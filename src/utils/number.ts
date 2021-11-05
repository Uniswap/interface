import { BigNumber, BigNumberish } from 'ethers'

export function isZero(n: BigNumberish) {
  return BigNumber.from(n).isZero()
}

export function isValidNumber(n: any) {
  // is not NaN: `NaN === NaN` => `false`
  // eslint-disable-next-line no-self-compare
  return typeof n === 'number' && n === n
}
