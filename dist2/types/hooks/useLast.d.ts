/**
 * Returns the last value of type T that passes a filter function
 * @param value changing value
 * @param filterFn function that determines whether a given value should be considered for the last value
 */
export default function useLast<T>(value: T | undefined | null, filterFn?: (value: T | null | undefined) => boolean): T | null | undefined;
