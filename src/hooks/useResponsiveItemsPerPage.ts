import { useMemo } from 'react'
import { useWindowSize } from './useWindowSize'
import { MEDIA_WIDTHS } from '../theme'

const { upToMedium } = MEDIA_WIDTHS

export function useResponsiveItemsPerPage(): number {
  const { width } = useWindowSize()

  return useMemo(() => {
    if (!width) return 0
    if (width <= upToMedium) return 6
    return 8
  }, [width])
}
