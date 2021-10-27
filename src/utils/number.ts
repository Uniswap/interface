import { BigNumber, BigNumberish } from 'ethers'

export function isZero(n: BigNumberish) {
  return BigNumber.from(n).isZero()
}
