// @deprecated in favor of useScreenSize
import { useScreenSize } from 'hooks/screenSize/useScreenSize'

export function useIsTablet(): boolean {
  const isScreenSize = useScreenSize()
  const isTablet = !isScreenSize['lg'] && isScreenSize['sm']

  return isTablet
}
