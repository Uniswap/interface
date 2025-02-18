import { useLayoutEffect, useRef } from 'react'

export function usePreviousWithLayoutEffect<T>(value: T): T {
  const ref = useRef(value)

  useLayoutEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
