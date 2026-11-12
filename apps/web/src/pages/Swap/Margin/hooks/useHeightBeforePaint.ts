import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

/**
 * The element's height, committed before the browser paints each resize. useParentSize reports a frame or
 * two late, which paints the terminal at its previous size as it settles. Observer callbacks run between
 * layout and paint, and flushSync commits the new height inside that window.
 */
export function useHeightBeforePaint<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>
  height: number
} {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }
    const measure = (): void => setHeight(element.offsetHeight)
    measure()
    const observer = new ResizeObserver(() => flushSync(measure))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, height }
}
