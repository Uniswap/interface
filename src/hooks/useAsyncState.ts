import { useEffect, useState } from 'react'

export function useAsyncState<T>(initialState: T, asyncGetter: () => Promise<T> | undefined): [T, () => void] {
  const [state, setState] = useState<T>(initialState)
  const [dirty, setDirty] = useState<boolean>(true)
  useEffect(() => {
    asyncGetter()
      ?.then((v) => {
        setState(v)
        setDirty(false)
      })
      .catch(console.warn)
  }, [asyncGetter, dirty])

  const refetch = () => {
    setDirty(true)
  }

  return [state, refetch]
}
