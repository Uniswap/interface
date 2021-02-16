import { useCallback, useState } from 'react'

export default function useToggle(initialState = false): [boolean, () => void] {
  const [state, setState] = useState(initialState)
  const toggle = useCallback(() => setState(state => !state), [])
  return [state, toggle]
}
