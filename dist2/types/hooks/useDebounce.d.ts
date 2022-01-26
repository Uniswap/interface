/**
 * Debounces updates to a value.
 * Non-primitives *must* wrap the value in useMemo, or the value will be updated due to referential inequality.
 */
export default function useDebounce<T>(value: T, delay: number): T;
