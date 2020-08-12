import { useEffect, useState } from 'react'

/**
 * Returns the last truthy value of type T
 * @param value changing value
 */
export default function useLast<T>(value: T | undefined | null): T | null | undefined {
  const [last, setLast] = useState<T | null | undefined>(value)
  useEffect(() => {
    setLast(last => value ?? last)
  }, [value])
  return last
}
