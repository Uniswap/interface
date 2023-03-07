// @deprecated in favor of useScreenSize
import { useScreenSize } from 'hooks/useScreenSize'

export function useIsMobile(): boolean {
  const isScreenSize = useScreenSize()
  const isMobile = !isScreenSize['sm']

  return isMobile
}
