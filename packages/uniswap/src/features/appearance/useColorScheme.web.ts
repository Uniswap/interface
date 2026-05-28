import { useLayoutEffect, useState } from 'react'
import { type ColorScheme } from 'uniswap/src/features/appearance/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Custom hook to detect and track the user's preferred color scheme.
 *
 * Features:
 * - Detects system color scheme preference immediately (no flicker)
 * - Listens for system color scheme changes in real-time
 * - Properly cleans up event listeners
 * - TypeScript support with strict typing
 *
 * @returns The current color scheme: 'light' or 'dark'
 */
/**
 * Creates a media query for dark mode preference and returns both the query and current preference
 */
function getDarkModeMediaQuery(): { mediaQuery: MediaQueryList | null; colorScheme: ColorScheme } {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    return {
      mediaQuery,
      colorScheme: mediaQuery.matches ? 'dark' : 'light',
    }
  } catch {
    // Fallback for browsers that don't support matchMedia
    return { mediaQuery: null, colorScheme: 'light' }
  }
}

export function useColorScheme(): ColorScheme {
  // Initialize with actual system preference to prevent flicker
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => getDarkModeMediaQuery().colorScheme)
  // Handler for color scheme changes
  const handleChange = useEvent((event: MediaQueryListEvent | MediaQueryList) => {
    setColorScheme(event.matches ? 'dark' : 'light')
  })

  // Use useLayoutEffect for synchronous updates to prevent flashing
  useLayoutEffect(() => {
    const { mediaQuery } = getDarkModeMediaQuery()

    if (!mediaQuery) {
      return
    }

    try {
      // Modern browsers
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)

        // oxlint-disable-next-line typescript/consistent-return
        return (): void => {
          mediaQuery.removeEventListener('change', handleChange)
        }
      }
      // Legacy browsers (Safari < 14)
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)

        // oxlint-disable-next-line typescript/consistent-return
        return (): void => {
          mediaQuery.removeListener(handleChange)
        }
      }
    } catch (error) {
      logger.warn('useColorScheme.web.tsx', 'getDarkModeMediaQuery', 'matchMedia is not supported:', error)
    }
  }, [handleChange])

  return colorScheme
}
