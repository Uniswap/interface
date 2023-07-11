import { useState } from 'react'

export function useSuspendIf(shouldSuspend = false) {
  const [resolve, setResolve] = useState<((val?: unknown) => void) | undefined>()

  if (!resolve && shouldSuspend) {
    const promise = new Promise((res) => {
      setResolve(res)
    })
    throw promise
  } else if (resolve && !shouldSuspend) {
    resolve()
    setResolve(undefined)
  }
}
