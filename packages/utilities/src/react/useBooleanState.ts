import { useCallback, useState } from 'react'

export function useBooleanState(initialValue: boolean = false): {
  value: boolean
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
  setValue: (value: boolean) => void
} {
  const [value, setValue] = useState(initialValue)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((prevValue) => !prevValue), [])

  return { value, setTrue, setFalse, toggle, setValue }
}
