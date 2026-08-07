import { useIsDarkMode } from 'ui/src'
import { POOLS_BRAND_GREEN_DARK, POOLS_BRAND_GREEN_LIGHT } from '~/pages/Launches/constants'

/** Resolved raw hex — consumers pass it to icon/text color props and to `opacifyRaw`. */
export function usePoolsBrandGreen(): string {
  const isDarkMode = useIsDarkMode()
  return isDarkMode ? POOLS_BRAND_GREEN_DARK : POOLS_BRAND_GREEN_LIGHT
}
