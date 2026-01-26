import { BigNumber } from '@ethersproject/bignumber'

/**
 * Returns the gas value plus a margin for unexpected or variable gas costs
 * @param value the gas value to pad
 * Increased multiplier from 1.2x to 2.0x to handle complex multi-hop swaps with nested calls
 */
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(200).div(100)
}
