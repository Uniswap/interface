import { useMemo } from 'react'
import { useExtractedColors, useSporeColors } from 'ui/src'
import { GlobalColorNames, colors as GlobalColors, GlobalPalette, opacify } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assert } from 'utilities/src/errors'
import { hexToRGB } from 'utilities/src/theme/colors'

export function getNetworkColorKey(chainId: UniverseChainId): `chain_${UniverseChainId}` {
  return `chain_${chainId}`
}

/** Helper to retrieve foreground and background colors for a given chain */
export function useNetworkColors(chainId: UniverseChainId): {
  foreground: string
  background: string
} {
  const colors = useSporeColors()
  const color = colors[getNetworkColorKey(chainId)].val

  const foreground = color
  assert(foreground, 'Network color is not defined in Theme')

  return {
    foreground,
    background: opacify(10, foreground),
  }
}

/**
 * @param uri image uri
 * @returns Extracts background color from image uri and finds closest theme colors.
 * Returns colors as raw hex code strings.
 */
export function useNearestThemeColorFromImageUri(uri: string | undefined): {
  color: string | undefined
  colorDark: string | undefined
  colorLight: string | undefined
} {
  // extract color from image
  const { colors: extractedImageColor } = useExtractedColors(uri, { colorStrategy: 'muted', fallback: 'accent1' })

  // find nearest theme color and convert to darkest version from theme
  return useMemo(() => {
    if (!extractedImageColor?.base) {
      return { color: undefined, colorDark: undefined, colorLight: undefined }
    }
    const color = findNearestThemeColor(extractedImageColor.base)
    const colorDark = adjustColorVariant(color, AdjustmentType.Darken)
    const colorLight = adjustColorVariant(color, AdjustmentType.Lighten)
    return {
      color: color ? GlobalColors[color] : undefined,
      colorDark: colorDark ? GlobalColors[colorDark] : undefined,
      colorLight: colorLight ? GlobalColors[colorLight] : undefined,
    }
  }, [extractedImageColor])
}

export enum AdjustmentType {
  Darken = 'darken',
  Lighten = 'lighten',
}

const colorPostfixes = ['Light', 'Pastel', 'Base', 'Vibrant', 'Dark']

/**
 * Replaces a GlobalPalette color variant with a dark or lighter version.
 * Example: blue200 -> blue900
 */
export function adjustColorVariant(
  colorName: GlobalColorNames | undefined,
  adjustmentType: AdjustmentType,
): keyof GlobalPalette | undefined {
  if (!colorName) {
    return undefined
  }

  const postfix = colorPostfixes.find((p) => colorName.endsWith(p))
  if (!postfix) {
    return undefined
  }

  const nextPostfix = colorPostfixes.indexOf(postfix) + (adjustmentType === AdjustmentType.Darken ? 1 : -1)
  const nextColor = colorName.replace(postfix, '') + colorPostfixes[nextPostfix]

  if (nextColor in GlobalColors) {
    return nextColor as keyof GlobalPalette
  }

  return undefined
}

// Finds closest theme color to a given hex string by comparing rgb values. Returns GlobalPalette color name.
export function findNearestThemeColor(hexString: string): keyof GlobalPalette | undefined {
  return Object.keys(GlobalColors).reduce(
    (closestMatch, currentColorName) => {
      const currentHex = GlobalColors[currentColorName as keyof GlobalPalette]
      const colorDiff = getColorDiffScore(hexString, currentHex)
      if (colorDiff && (!closestMatch.colorDiff || colorDiff < closestMatch.colorDiff)) {
        return { colorDiff, colorName: currentColorName as keyof GlobalPalette }
      }
      return closestMatch
    },
    {
      colorDiff: Infinity,
      colorName: undefined,
    } as {
      colorDiff: number | undefined
      colorName: keyof GlobalPalette | undefined
    },
  ).colorName
}

/**
 * Returns a number representing the difference between two colors. Lower means more similar.
 */
export function getColorDiffScore(colorA: string | null, colorB: string | null): number | undefined {
  if (!colorA || !colorB) {
    return undefined
  }
  const a = hexToRGB(colorA)
  const b = hexToRGB(colorB)
  if (!a || !b) {
    return undefined
  }
  // Range 1 -> 442, add one to avoid comparison bugs when result is 0
  return Math.sqrt(Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)) + 1
}
