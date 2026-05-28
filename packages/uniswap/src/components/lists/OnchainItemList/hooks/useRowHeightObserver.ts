import { Key, RefObject, useEffect, useLayoutEffect } from 'react'

type RowHeightUpdate = {
  index: number
  measurementKey: string
  height: number
}

type UseRowHeightObserverParams = {
  ref: RefObject<HTMLElement | null>
  index: number
  measurementKey: string
  updateRowHeight: ((update: RowHeightUpdate) => void) | undefined
  itemKey: Key | undefined
  needsDynamicHeight: boolean
}
export function useRowHeightObserver({
  ref,
  index,
  measurementKey,
  updateRowHeight,
  itemKey,
  needsDynamicHeight,
}: UseRowHeightObserverParams): void {
  // Sync: measures before paint — prevents 1-frame overflow when expanded state changes
  useLayoutEffect(() => {
    if (!needsDynamicHeight || !ref.current || !updateRowHeight) {
      return
    }
    const height = ref.current.getBoundingClientRect().height
    if (height) {
      updateRowHeight({ index, measurementKey, height })
    }
  })

  useEffect(() => {
    if (!needsDynamicHeight || !ref.current || !updateRowHeight) {
      return undefined
    }
    const observer = new ResizeObserver(([entry]) => {
      // borderBoxSize matches getBoundingClientRect().height used in the layout effect above
      const height = entry?.borderBoxSize[0]?.blockSize ?? entry?.contentRect.height
      if (height) {
        updateRowHeight({ index, measurementKey, height })
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index, measurementKey, updateRowHeight, itemKey, needsDynamicHeight, ref])
}
