import { useMemo } from 'react'
import { isMobile, isTablet } from 'react-device-detect'

export function useResponsiveItemsPerPage(wideCards: boolean): number {
  return useMemo(() => {
    if (isMobile) return wideCards ? 3 : 6
    if (isTablet) return wideCards ? 4 : 8
    return wideCards ? 9 : 12
  }, [wideCards])
}
