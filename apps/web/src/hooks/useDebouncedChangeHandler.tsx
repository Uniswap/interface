import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Easy way to debounce the handling of a rapidly changing value, e.g. a changing slider input
 * @param value value that is rapidly changing
 * @param onChange change handler that should receive the debounced updates to the value
 * @param debouncedMs how long we should wait for changes to be applied
 */
export default function useDebouncedChangeHandler<T>(
  value: T,
  onChange: (newValue: T) => void,
  debouncedMs = 100,
): [T, (value: T) => void] {
  const [inner, setInner] = useState<T>(() => value)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const onChangeInner = useCallback(
    (newValue: T) => {
      setInner(newValue)
      if (timer.current) {
        clearTimeout(timer.current)
      }
      timer.current = setTimeout(() => {
        onChange(newValue)
        timer.current = undefined
      }, debouncedMs)
    },
    [debouncedMs, onChange],
  )

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = undefined
    }
    setInner(value)
  }, [value])

  return [inner, onChangeInner]
}
