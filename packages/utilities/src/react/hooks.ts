import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

// modified from https://usehooks.com/usePrevious/
export function usePrevious<T>(value: T): T | undefined {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef<T>()

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

// adapted from https://usehooks.com/useAsync/ but simplified
// above link contains example on how to add delayed execution if ever needed
export function useAsyncData<T>(
  asyncCallback: () => Promise<T> | undefined,
  onCancel?: () => void
): {
  isLoading: boolean
  data: T | undefined
  error?: Error
} {
  const [state, setState] = useState<{
    data: T | undefined
    isLoading: boolean
    error?: Error
  }>({
    data: undefined,
    isLoading: true,
    error: undefined,
  })
  const onCancelRef = useRef(onCancel)
  const lastCompletedAsyncCallbackRef = useRef(asyncCallback)

  useEffect(() => {
    let isPending = false

    async function runCallback(): Promise<void> {
      isPending = true
      setState((prevState) => {
        if (!prevState.error) {
          // Return the same state to avoid an unneeded re-render.
          return prevState
        }
        return { ...prevState, error: undefined }
      })
      const data = await asyncCallback()
      if (isPending) {
        lastCompletedAsyncCallbackRef.current = asyncCallback
        setState((prevState) => ({ ...prevState, data, isLoading: false }))
      }
    }

    runCallback()
      .catch((error) => {
        setState((prevState) => ({ ...prevState, error }))
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

// modified from https://usehooks.com/useMemoCompare/
export function useMemoCompare<T>(next: () => T, compare: (a: T | undefined, b: T) => boolean): T {
  // Ref for storing previous value
  const previousRef = useRef<T>()
  const previous = previousRef.current
  const nextValue = next()

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, nextValue)

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  if (!isEqual || !previous) {
    previousRef.current = nextValue
  }

  // Finally, if equal then return the previous value if it's set
  return isEqual && previous ? previous : nextValue
}

// This hook is a hacky way to forward the entire ref from the child to the parent
// component. This is useful when the parent component needs to access the child's
// ref and the ref is used in the child component.
export function useForwardRef<T extends object>(
  forwardedRef: React.ForwardedRef<T>,
  localRef: React.RefObject<T>
): void {
  useImperativeHandle<T, T>(
    forwardedRef,
    () =>
      new Proxy({} as T, {
        get: (_, prop): T[keyof T] | undefined => {
          return localRef.current?.[prop as keyof T]
        },
      })
  )
}
