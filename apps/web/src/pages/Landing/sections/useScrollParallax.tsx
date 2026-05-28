import { useLayoutEffect, useRef } from 'react'
import { getScrollY, subscribe } from '~/state/scroll/scrollStore'

// Drives Hero parallax via direct DOM style mutations using refs instead of React state, so scroll events don't trigger a component re-render.

export function useScrollParallax(enabled: boolean) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!enabled) {
      const refs = [outerRef, innerRef, chevronRef]
      refs.forEach((ref) => {
        if (ref.current) {
          ref.current.style.transform = ''
          ref.current.style.opacity = ''
        }
      })
      return undefined
    }

    function applyScrollEffects(y: number) {
      const translateY = -y / 7
      const opacity = Math.max(0, 1 - y / 1000)

      if (outerRef.current) {
        outerRef.current.style.transform = `translateY(${translateY}px)`
        outerRef.current.style.opacity = String(opacity)
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(0px, ${translateY}px)`
        innerRef.current.style.opacity = String(opacity)
      }
      if (chevronRef.current) {
        chevronRef.current.style.transform = `translate(0px, ${translateY}px)`
        chevronRef.current.style.opacity = String(y > 100 ? 0 : opacity)
      }
    }

    applyScrollEffects(getScrollY())
    return subscribe(() => applyScrollEffects(getScrollY()))
  }, [enabled])

  return { outerRef, innerRef, chevronRef }
}
