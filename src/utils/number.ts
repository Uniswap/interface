import { BigNumber, BigNumberish } from 'ethers'

export function isZero(n: BigNumberish) {
  return BigNumber.from(n).isZero()
}

export function BigNumberMax(bn1: BigNumber, bn2: BigNumber) {
  return bn1.lte(bn2) ? bn2 : bn1
}

export function toStringish(n?: BigNumberish) {
  if (n === undefined) return

  return BigNumber.from(n).toString()
}
