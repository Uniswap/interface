import { useEffect, useRef, useState } from 'react'

/**
 * Hook to detect when a sticky header element should show a border
 * Returns true when the element would reach the specified sticky position
 * @param stickyTop - The top offset where the element becomes sticky (e.g., INTERFACE_NAV_HEIGHT)
 */
export function useStickyHeaderBorder(stickyTop: number = 0) {
  const [showBorder, setShowBorder] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return undefined
    }

    const handleScroll = () => {
      const rect = element.getBoundingClientRect()
      // Show border when the element reaches or passes the sticky position
      // This happens when the element's top is at or above the sticky threshold
      setShowBorder(rect.top <= stickyTop)
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [stickyTop])

  return { showBorder, elementRef }
}
