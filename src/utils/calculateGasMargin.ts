import { BigNumber } from '@ethersproject/bignumber'
import { TX_GAS_MARGIN } from 'constants/misc'

/**
 * Returns the gas value plus a margin for unexpected or variable gas costs
 * @param value the gas value to pad
 */
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.add(value.mul(Math.floor(TX_GAS_MARGIN * 100)).div(100))
}
