import { BigNumber } from '@ethersproject/bignumber';
/**
 * Returns the gas value plus a margin for unexpected or variable gas costs
 * @param value the gas value to pad
 */
export declare function calculateGasMargin(value: BigNumber): BigNumber;
