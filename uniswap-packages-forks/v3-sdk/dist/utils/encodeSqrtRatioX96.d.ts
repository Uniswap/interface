import JSBI from 'jsbi';
import { BigintIsh } from '@uniswap/sdk-core';
/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param amount1 the numerator amount, i.e. amount of token1
 * @param amount0 the denominator amount, i.en amount of token0
 */
export declare function encodeSqrtRatioX96(amount1: BigintIsh, amount0: BigintIsh): JSBI;
