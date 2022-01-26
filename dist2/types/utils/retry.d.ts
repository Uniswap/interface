/**
 * Throw this error if the function should retry
 */
export declare class RetryableError extends Error {
    isRetryableError: true;
}
export interface RetryOptions {
    n: number;
    minWait: number;
    maxWait: number;
}
/**
 * Retries the function that returns the promise until the promise successfully resolves up to n retries
 * @param fn function to retry
 * @param n how many times to retry
 * @param minWait min wait between retries in ms
 * @param maxWait max wait between retries in ms
 */
export declare function retry<T>(fn: () => Promise<T>, { n, minWait, maxWait }: RetryOptions): {
    promise: Promise<T>;
    cancel: () => void;
};
