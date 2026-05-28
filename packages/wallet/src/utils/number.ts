import { BigNumber, BigNumberish } from 'ethers'

export function isZero(n: BigNumberish): boolean {
  return BigNumber.from(n).isZero()
}

export function BigNumberMax(bn1: BigNumber, bn2: BigNumber): BigNumber {
  return bn1.lte(bn2) ? bn2 : bn1
}

export function toStringish(n?: BigNumberish): string | undefined {
  if (n === undefined) {
    return undefined
  }

  return BigNumber.from(n).toString()
}
