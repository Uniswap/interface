import type { DependencyList } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'

/**
 * Web implementation of Reanimated hooks.
 *
 * These are simplified implementations that provide the same API as Reanimated
 * but use React state/refs instead of worklets. Animations won't interpolate
 * smoothly on web - for complex animations, use CSS transitions or platform-specific files.
 */

/**
 * Shared value type for web - uses a ref-like pattern with subscription support.
 */
export interface SharedValue<T> {
  value: T
  _listeners: Set<() => void>
  addListener: (listener: () => void) => () => void
}

/**
 * Creates a shared value that triggers re-renders when assigned via `.value`.
 * This enables useAnimatedStyle to re-run when values change.
 */
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  const listeners = useRef(new Set<() => void>())
  const valueRef = useRef(initialValue)

  // Create the shared value object once
  const sharedValue = useMemo(() => {
    const sv: SharedValue<T> = {
      get value() {
        return valueRef.current
      },
      set value(newValue: T) {
        valueRef.current = newValue
        // Notify all listeners (useAnimatedStyle hooks)
        listeners.current.forEach((listener) => listener())
      },
      _listeners: listeners.current,
      addListener: (listener: () => void) => {
        listeners.current.add(listener)
        return () => listeners.current.delete(listener)
      },
    }
    return sv
  }, [])

  return sharedValue
}

/**
 * Creates a style object that updates when shared values change.
 * On web, this runs the updater function and returns the result.
 *
 * Pass shared values in the deps array to subscribe to their updates.
 * When any shared value's `.value` is set, the style will be recomputed.
 */
export function useAnimatedStyle<T extends ViewStyle>(updater: () => T, deps?: DependencyList): T {
  // Force re-render when shared values change
  const [, forceUpdate] = useState(0)
  const updaterRef = useRef(updater)
  updaterRef.current = updater

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1)
  }, [])

  // Subscribe to shared value updates
  // Users must pass shared values in deps array for reactivity
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the user-provided dependency array containing shared values
  useEffect(() => {
    const cleanups: (() => void)[] = []

    // Subscribe to any SharedValue objects in the deps array
    if (deps) {
      for (const dep of deps) {
        if (dep && typeof dep === 'object' && 'addListener' in dep && typeof dep.addListener === 'function') {
          const cleanup = dep.addListener(triggerUpdate)
          cleanups.push(cleanup)
        }
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [triggerUpdate, ...(deps || [])])

  // Run the updater and return the style
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the user-provided dependency array
  const style = useMemo(() => {
    try {
      return updaterRef.current()
    } catch {
      // If the updater fails (e.g., accessing undefined shared value), return empty style
      return {} as T
    }
  }, [triggerUpdate, ...(deps || [])])

  return style
}
