// @deprecated in favor of useScreenSize
import { useScreenSize } from 'hooks/screenSize'

export function useIsNavSearchInputVisible(): boolean {
  const isScreenSize = useScreenSize()
  return isScreenSize.navSearchInputVisible
}
