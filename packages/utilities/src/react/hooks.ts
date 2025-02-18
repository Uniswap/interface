import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  onCancel?: () => void,
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

export function useOnClickOutside<T extends HTMLElement>(
  node: RefObject<T | undefined>,
  handler: undefined | (() => void),
  ignoredNodes: Array<RefObject<T | undefined>> = [],
): void {
  const handlerRef = useRef<undefined | (() => void)>(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const nodeClicked = node.current?.contains(e.target as Node)
      const ignoredNodeClicked = ignoredNodes.reduce(
        (reducer, val) => reducer || !!val.current?.contains(e.target as Node),
        false,
      )

      if ((nodeClicked || ignoredNodeClicked) ?? false) {
        return
      }

      if (handlerRef.current) {
        handlerRef.current()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [node, ignoredNodes])
}

/**
 * Hook that returns a stable callback function which always invokes the latest version of the provided callback.
 * This eliminates the need for a dependency array and helps prevent memory leaks caused by stale closures.
 *
 * @typeParam T - A tuple representing the argument types of the callback function.
 * @typeParam U - The return type of the callback function.
 * @param {(...args: T) => U} callback - The callback function to be stabilized.
 * @returns {(...args: T) => U} A stable callback function that always calls the latest version of the provided callback.
 *
 * @see {@link https://www.schiener.io/2024-03-03/react-closures}
 * @see {@link https://github.com/facebook/react/issues/14099}
 * @see {@link https://github.com/stutrek/use-callback-stable
 */
export function useEvent<T extends unknown[], U>(callback: (...args: T) => U): (...args: T) => U {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  return useCallback((...args: T) => callbackRef.current(...args), [])
}
