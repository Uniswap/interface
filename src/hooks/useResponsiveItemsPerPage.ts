import { useMemo } from 'react'
import { useWindowSize } from './useWindowSize'
import { MEDIA_WIDTHS } from '../theme'

const { upToSmall, upToMedium } = MEDIA_WIDTHS

export function useResponsiveItemsPerPage(wideCards: boolean): number {
  const { width } = useWindowSize()

  return useMemo(() => {
    if (!width) return 0
    if (width <= upToSmall) return wideCards ? 3 : 6
    if (width <= upToMedium) return wideCards ? 3 : 6
    return wideCards ? 9 : 12
  }, [wideCards, width])
}
