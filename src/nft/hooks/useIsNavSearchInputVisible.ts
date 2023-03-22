// @deprecated in favor of useScreenSize
import { useScreenSize } from 'hooks/useScreenSize'

export function useIsNavSearchInputVisible(): boolean {
  const isScreenSize = useScreenSize()
  return isScreenSize['navSearchInputVisible']
}
