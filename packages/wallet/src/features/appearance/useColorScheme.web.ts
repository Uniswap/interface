import { useEffect, useLayoutEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { isBrowser } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { type ColorScheme } from 'wallet/src/features/appearance/types'

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
  if (!isBrowser) {
    return { mediaQuery: null, colorScheme: 'light' }
  }

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
  const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

  useIsomorphicLayoutEffect(() => {
    if (!isBrowser) {
      return
    }

    const { mediaQuery } = getDarkModeMediaQuery()

    if (!mediaQuery) {
      return
    }

    try {
      // Modern browsers
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)

        // eslint-disable-next-line consistent-return
        return (): void => {
          mediaQuery.removeEventListener('change', handleChange)
        }
      }
      // Legacy browsers (Safari < 14)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)

        // eslint-disable-next-line consistent-return
        return (): void => {
          mediaQuery.removeListener(handleChange)
        }
      }
    } catch (error) {
      logger.warn('useColorScheme.web.tsx', 'getDarkModeMediaQuery', 'matchMedia is not supported:', error)
    }
  }, [])

  return colorScheme
}
