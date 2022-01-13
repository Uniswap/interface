import { useState, useEffect, Dispatch, SetStateAction } from 'react'

function useLocalStorageState<S>(key: string, defaultValue: S | (() => S)): [S, Dispatch<SetStateAction<S>>] {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : defaultValue
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorageState
