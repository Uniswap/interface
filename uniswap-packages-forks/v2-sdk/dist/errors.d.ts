/**
 * Indicates that the pair has insufficient reserves for a desired output amount. I.e. the amount of output cannot be
 * obtained by sending any amount of input.
 */
export declare class InsufficientReservesError extends Error {
    readonly isInsufficientReservesError: true;
    constructor();
}
/**
 * Indicates that the input amount is too small to produce any amount of output. I.e. the amount of input sent is less
 * than the price of a single unit of output after fees.
 */
export declare class InsufficientInputAmountError extends Error {
    readonly isInsufficientInputAmountError: true;
    constructor();
}
