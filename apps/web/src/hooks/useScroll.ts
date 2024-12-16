import { useEffect, useState } from 'react'

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}
export function useScroll() {
  const [direction, setDirection] = useState<ScrollDirection | undefined>()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const [height, setHeight] = useState(window.scrollY)

  useEffect(() => {
    let previousScrollPosition = 0
    let currentScrollPosition = 0

    const scrollListener = () => {
      setIsScrolledDown(window.scrollY > 0)
      if (window.scrollY >= 0) {
        setHeight(window.scrollY)
        currentScrollPosition = window.scrollY
      }

      if (previousScrollPosition < currentScrollPosition) {
        setDirection(ScrollDirection.DOWN)
      } else if (previousScrollPosition > currentScrollPosition) {
        setDirection(ScrollDirection.UP)
      }

      // Update the previous value
      previousScrollPosition = currentScrollPosition
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])
  return { direction, isScrolledDown, height }
}
