import { useEffect } from 'react'

/**
 * Disable scroll of an element based on condition
 */
export function useImperativeDisableScroll({ element, disabled }: { element?: HTMLElement; disabled?: boolean }) {
  useEffect(() => {
    if (!element) return

    element.style.overflowY = disabled ? 'hidden' : 'auto'

    return () => {
      element.style.overflowY = 'auto'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])
}
