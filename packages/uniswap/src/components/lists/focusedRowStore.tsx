import { createContext, type ReactNode, useContext, useState, useSyncExternalStore } from 'react'

/**
 * Keyboard/hover focus index for one list, kept outside React state so that moving focus re-renders only the row
 * losing it and the row gaining it. Holding it in the list consumer's state re-rendered every mounted row on each
 * mouse-enter, through `renderItem` and the engine's `extraData`.
 */
export interface FocusedRowStore {
  getFocusedRowIndex: () => number | undefined
  setFocusedRowIndex: (index: number | undefined) => void
  subscribe: (listener: () => void) => () => void
}

export function createFocusedRowStore(initialIndex?: number): FocusedRowStore {
  let focusedRowIndex = initialIndex
  const listeners = new Set<() => void>()
  return {
    getFocusedRowIndex: (): number | undefined => focusedRowIndex,
    setFocusedRowIndex: (index): void => {
      if (index === focusedRowIndex) {
        return
      }
      focusedRowIndex = index
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener): (() => void) => {
      listeners.add(listener)
      return (): void => {
        listeners.delete(listener)
      }
    },
  }
}

/** Provided by the list around its rows; absent (e.g. native, or a list without keyboard nav) reads as unfocused. */
export const FocusedRowStoreContext = createContext<FocusedRowStore | undefined>(undefined)

/** One store per list instance, owned by the consumer that drives focus (arrow keys, hover, auto-focus). */
export function useCreateFocusedRowStore(): FocusedRowStore {
  const [store] = useState(createFocusedRowStore)
  return store
}

function noopSubscribe(): () => void {
  return (): void => {}
}

function getFalse(): boolean {
  return false
}

/** Whether `rowIndex` is the list's focused row. Re-renders the caller only when that boolean flips. */
export function useIsRowFocused(rowIndex: number | undefined): boolean {
  const store = useContext(FocusedRowStoreContext)
  return useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => store !== undefined && rowIndex !== undefined && store.getFocusedRowIndex() === rowIndex,
    getFalse,
  )
}

/** Render-prop form of {@link useIsRowFocused} for the plain-function `renderItem` call sites that can't use hooks. */
export function FocusedRow({
  rowIndex,
  children,
}: {
  rowIndex: number
  children: (isFocused: boolean) => ReactNode
}): JSX.Element {
  const isFocused = useIsRowFocused(rowIndex)
  return <>{children(isFocused)}</>
}
