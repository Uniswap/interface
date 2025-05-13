import { useMemo } from 'react'
import type { ColorTokens } from 'tamagui'
import { opacify, validColor } from 'ui/src/theme'

export const useColorsFromTokenColor = (
  tokenColor?: string,
): Record<'validTokenColor' | 'lightTokenColor', ColorTokens | undefined> => {
  const { validTokenColor, lightTokenColor } = useMemo(() => {
    const validatedColor = validColor(tokenColor)

    return {
      validTokenColor: tokenColor ? validatedColor : undefined,
      lightTokenColor: tokenColor ? opacify(12, validatedColor) : undefined,
    }
  }, [tokenColor])

  return { validTokenColor, lightTokenColor }
}
