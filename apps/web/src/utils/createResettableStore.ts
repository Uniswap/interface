import { create } from 'zustand'

/**
 * Factory for creating Zustand stores with built-in reset functionality.
 * Provides a simple API for stores that need to be reset to their initial value.
 *
 * Usage:
 *   const useMyStore = createResettableStore<MyType>(initialValue)
 *
 *   // Reading (use selector to subscribe to changes)
 *   const data = useMyStore((s) => s.data)
 *
 *   // Writing (use getState() for stable actions that don't cause re-renders)
 *   const { set, reset } = useMyStore.getState()
 *   set(newValue)
 *   reset()
 */

// eslint-disable-next-line import/no-unused-modules
export interface ResettableState<T> {
  data: T
  set: (value: T) => void
  reset: () => void
}

export function createResettableStore<T>(initialValue: T) {
  return create<ResettableState<T>>((set) => ({
    data: initialValue,
    set: (value) => set({ data: value }),
    reset: () => set({ data: initialValue }),
  }))
}
