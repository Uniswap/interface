import { BigNumber, type BigNumberish } from '@ethersproject/bignumber'

/**
 * Converts any BigNumberish value to bigint. For migration boundaries
 * where consumers expect bigint but producers (eg. ethers Provider)
 * still emit BigNumber. Remove when all producers are migrated.
 */
export function toBigInt(value: BigNumberish): bigint {
  if (typeof value === 'bigint') {
    return value
  }
  return BigNumber.from(value).toBigInt()
}
