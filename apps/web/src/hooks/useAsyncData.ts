import { useEffect, useMemo, useRef, useState } from 'react'

// TODO: https://linear.app/uniswap/issue/WEB-3495/import-useasyncdata-from-mobile
export function useAsyncData<T>(
  asyncCallback: () => Promise<T> | undefined,
  onCancel?: () => void
): {
  isLoading: boolean
  data?: T
} {
  const [state, setState] = useState<{
    data?: T
    isLoading: boolean
  }>({
    data: undefined,
    isLoading: true,
  })
  const onCancelRef = useRef(onCancel)
  const lastCompletedAsyncCallbackRef = useRef(asyncCallback)

  useEffect(() => {
    let isPending = false

    async function runCallback(): Promise<void> {
      isPending = true
      const data = await asyncCallback()
      if (isPending) {
        lastCompletedAsyncCallbackRef.current = asyncCallback
        setState((prevState) => ({ ...prevState, data, isLoading: false }))
      }
    }

    runCallback()
      .catch(() => {
        if (isPending) {
          lastCompletedAsyncCallbackRef.current = asyncCallback
          setState((prevState) => ({ ...prevState, isLoading: false }))
        }
      })
      .finally(() => {
        isPending = false
      })

    const handleCancel = onCancelRef.current

    return () => {
      if (!isPending) {
        return
      }
      isPending = false
      if (handleCancel) {
        handleCancel()
      }
    }
  }, [asyncCallback])

  return useMemo(() => {
    if (asyncCallback !== lastCompletedAsyncCallbackRef.current) {
      return { isLoading: true, data: undefined }
    }
    return state
  }, [asyncCallback, state])
}
