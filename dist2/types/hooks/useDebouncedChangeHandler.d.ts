/**
 * Easy way to debounce the handling of a rapidly changing value, e.g. a changing slider input
 * @param value value that is rapidly changing
 * @param onChange change handler that should receive the debounced updates to the value
 * @param debouncedMs how long we should wait for changes to be applied
 */
export default function useDebouncedChangeHandler<T>(value: T, onChange: (newValue: T) => void, debouncedMs?: number): [T, (value: T) => void];
