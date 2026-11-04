import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'

/** The hero's "Pools" wordmark reads darker on light surfaces; dark mode shares the brand green. */
const POOLS_WORDMARK_GREEN_LIGHT = '#47AC2A'

/** The hero wordmark's green: darker than the brand green on light surfaces, the same in dark mode. */
export function usePoolsWordmarkGreen(): string {
  const isDarkMode = useIsDarkMode()
  const brandGreen = usePoolsBrandGreen()
  return isDarkMode ? brandGreen : POOLS_WORDMARK_GREEN_LIGHT
}
