import { useEffect, useRef, useState } from 'react'

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}
export function useScroll({ enabled = true }: { enabled?: boolean } = {}) {
  const [direction, setDirection] = useState<ScrollDirection | undefined>()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const [height, setHeight] = useState(window.scrollY)
  const rafIdRef = useRef<number | null>(null)
  const scrollDataRef = useRef({ previousScrollPosition: window.scrollY, currentScrollPosition: window.scrollY })

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      return undefined
    }

    const updateScrollState = () => {
      // When a modal opens, ScrollLock sets body.position = 'fixed' which causes
      // window.scrollY to become 0. In this case, we should preserve the last known
      // scroll state to prevent the header from incorrectly becoming transparent.
      const isScrollLocked = document.body.style.position === 'fixed'
      if (isScrollLocked) {
        rafIdRef.current = null
        return
      }

      const scrollY = window.scrollY
      const { previousScrollPosition } = scrollDataRef.current

      setIsScrolledDown(scrollY > 0)
      if (scrollY >= 0) {
        setHeight(scrollY)
        scrollDataRef.current.currentScrollPosition = scrollY
      }

      if (previousScrollPosition < scrollDataRef.current.currentScrollPosition) {
        setDirection(ScrollDirection.DOWN)
      } else if (previousScrollPosition > scrollDataRef.current.currentScrollPosition) {
        setDirection(ScrollDirection.UP)
      }

      scrollDataRef.current.previousScrollPosition = scrollDataRef.current.currentScrollPosition
      rafIdRef.current = null
    }

    const scrollListener = () => {
      if (rafIdRef.current !== null) {
        return
      }

      rafIdRef.current = requestAnimationFrame(updateScrollState)
    }

    window.addEventListener('scroll', scrollListener, { passive: true })
    // Check initial scroll position
    updateScrollState()

    return () => {
      window.removeEventListener('scroll', scrollListener)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [enabled])
  return { direction, isScrolledDown, height }
}
