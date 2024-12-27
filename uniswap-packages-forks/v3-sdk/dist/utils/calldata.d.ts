import { BigintIsh } from '@uniswap/sdk-core';
/**
 * Generated method parameters for executing a call.
 */
export interface MethodParameters {
    /**
     * The hex encoded calldata to perform the given operation
     */
    calldata: string;
    /**
     * The amount of ether (wei) to send in hex.
     */
    value: string;
}
export declare function toHex(bigintIsh: BigintIsh): string;
