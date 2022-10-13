export interface AsyncThrottleOptions {
    interval?: number;
    onError?: (error: unknown) => void;
}
export declare function asyncThrottle<Args extends readonly unknown[]>(func: (...args: Args) => Promise<void>, { interval, onError }?: AsyncThrottleOptions): (...args: Args) => void;
