import { useMemo } from 'react'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { LogolessColors, logolessColorSchemes } from 'ui/src/utils/colors/constants'
import type { LogolessColorScheme, TamaguiColor } from 'ui/src/utils/colors/types'
import { getLogolessColorIndex } from 'ui/src/utils/colors/utils/getLogolessColorIndex'

/**
 * Picks a color scheme for a token that doesn't have a logo.
 * The color scheme is derived from the characters of the token name and will only change if the name changes
 * @param tokenName The name of the token
 * @returns a light and dark version of a color scheme with a foreground and background color
 */
function useLogolessColorScheme(tokenName: string): LogolessColorScheme {
  return useMemo(() => {
    const index = getLogolessColorIndex(tokenName, Object.keys(LogolessColors).length)

    return logolessColorSchemes[LogolessColors[Object.keys(LogolessColors)[index] as keyof typeof LogolessColors]]
  }, [tokenName])
}

/**
 * Wraps `useLogolessColorScheme`. This hook is used to generate a color scheme for any icon that doesn't have a logo,
 * accounting for dark mode as well.
 *
 * @param seed a string used to generate the color scheme
 * @returns the foreground and background colors for the color scheme
 */
export function useColorSchemeFromSeed(seed: string): {
  foreground: TamaguiColor
  background: TamaguiColor
} {
  const isDarkMode = useIsDarkMode()
  const logolessColorScheme = useLogolessColorScheme(seed)
  const { foreground, background } = isDarkMode ? logolessColorScheme.dark : logolessColorScheme.light

  return { foreground, background }
}
