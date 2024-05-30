// @deprecated in favor of useScreenSize
import { useScreenSize } from 'hooks/screenSize/useScreenSize'

export function useIsMobile(): boolean {
  const isScreenSize = useScreenSize()
  const isMobile = !isScreenSize['sm']

  return isMobile
}
