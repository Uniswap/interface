import { useEffect, useState } from 'react'

/**
 * True when the viewport is narrow enough that the Terminal should switch to its
 * mobile layout (rail becomes a slide-in drawer, content goes full-width).
 * Self-contained (matchMedia + resize) so it works inside the inline-styled
 * Terminal subtree without depending on the app's Tamagui media system.
 */
const MOBILE_MAX_WIDTH = 900

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth <= MOBILE_MAX_WIDTH
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const onChange = (): void => setIsMobile(mql.matches)
    onChange()
    // addEventListener('change') is the modern API; fall back for older Safari.
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}
