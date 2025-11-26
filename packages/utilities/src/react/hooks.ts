import { RefObject, useCallback, useEffect, useRef } from 'react'

// modified from https://usehooks.com/usePrevious/
export function usePrevious<T>(value: T): T | undefined {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef<T>(undefined)

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

// modified from https://usehooks.com/useMemoCompare/
export function useMemoCompare<T>(next: () => T, compare: (a: T | undefined, b: T) => boolean): T {
  // Ref for storing previous value
  const previousRef = useRef<T>(undefined)
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

export function useOnClickOutside<T extends HTMLElement>({
  node,
  handler,
  ignoredNodes = [],
  event = 'mousedown',
}: {
  node: RefObject<T | undefined | null>
  handler?: () => void
  ignoredNodes?: Array<RefObject<HTMLElement | undefined | null>>
  event?: 'mousedown' | 'mouseup'
}): void {
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

      if (nodeClicked || ignoredNodeClicked) {
        return
      }

      if (handlerRef.current) {
        handlerRef.current()
      }
    }

    document.addEventListener(event, handleClickOutside)

    return () => {
      document.removeEventListener(event, handleClickOutside)
    }
  }, [node, ignoredNodes, event])
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
 * @see {@link https://github.com/stutrek/use-callback-stable}
 */

export function useEvent<T, S extends T>(callback: (param: S | T) => param is S): (param: S | T) => param is S
export function useEvent<T, S extends T, A extends unknown[]>(
  callback: (param: S | T, ...args: A) => param is S,
): (param: S | T, ...args: A) => param is S
export function useEvent<A extends unknown[], R>(callback: (...args: A) => R): (...args: A) => R
export function useEvent<A extends unknown[], R>(callback: (...args: A) => R): (...args: A) => R {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  return useCallback((...args: A) => callbackRef.current(...args), [])
}
