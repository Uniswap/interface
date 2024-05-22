import { useMemo } from 'react'
import { useExtractedColors, useSporeColors } from 'ui/src'
import { colors as GlobalColors, GlobalPalette, colorsLight } from 'ui/src/theme'
import { assert } from 'utilities/src/errors'
import { ChainId } from 'wallet/src/constants/chains'
import { hex } from 'wcag-contrast'

export const MIN_COLOR_CONTRAST_THRESHOLD = 3

/**
 * Add opacity information to a hex color
 * @param amount opacity value from 0 to 100
 * @param hexColor
 */
export function opacify(amount: number, hexColor: string): string {
  if (!hexColor.startsWith('#')) {
    return hexColor
  }

  if (hexColor.length !== 7) {
    throw new Error(
      `opacify: provided color ${hexColor} was not in hexadecimal format (e.g. #000000)`
    )
  }

  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }

  const opacityHex = Math.round((amount / 100) * 255).toString(16)
  const opacifySuffix = opacityHex.length < 2 ? `0${opacityHex}` : opacityHex

  return `${hexColor.slice(0, 7)}${opacifySuffix}`
}

export function getNetworkColorKey(chainId: ChainId): `chain_${ChainId}` {
  return `chain_${chainId}`
}

/** Helper to retrieve foreground and background colors for a given chain */
export function useNetworkColors(chainId: ChainId): {
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
 * Picks a contrast-passing text color to put on top of a given background color.
 * The threshold right now is 3.0, which is the WCAG AA standard.
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns either 'sporeWhite' or 'sporeBlack'
 */
export function getContrastPassingTextColor(
  backgroundColor: string
): '$sporeWhite' | '$sporeBlack' {
  const lightText = colorsLight.sporeWhite
  if (hex(lightText, backgroundColor) >= MIN_COLOR_CONTRAST_THRESHOLD) {
    return '$sporeWhite'
  }
  return '$sporeBlack'
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
  const { colors: extractedImageColor } = useExtractedColors(uri)

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

const ColorVariant = {
  [AdjustmentType.Darken]: '900',
  [AdjustmentType.Lighten]: '200',
}

/**
 * Replaces a GlobalPalette color variant with a dark or lighter version.
 * Example: blue200 -> blue900
 */
export function adjustColorVariant(
  colorName: string | undefined,
  adjustmentType: AdjustmentType
): keyof GlobalPalette | undefined {
  if (!colorName) {
    return undefined
  }
  const newVariantSuffix = ColorVariant[adjustmentType]
  // Check for non-numerical "vibrant" color key
  if (colorName.includes('Vibrant')) {
    const updatedColorKey = colorName.replace('Vibrant', newVariantSuffix)
    // enforce we have a valid theme color
    if (updatedColorKey in GlobalColors) {
      return updatedColorKey as keyof GlobalPalette
    }
  }

  // Check that we arrive at a valid color key from theme with a numbered variant (ignore black/white)
  const matchesColorName = colorName.match(/\d+/g)
  if (!matchesColorName) {
    return undefined
  }

  // Replace hex value and any digits with 900, the darkest color code in theme
  const updatedColorKey = colorName.replace(/\d+/g, newVariantSuffix)
  if (updatedColorKey in GlobalColors) {
    return updatedColorKey as keyof GlobalPalette
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
    }
  ).colorName
}

/**
 * Returns a number representing the difference between two colors. Lower means more similar.
 */
export function getColorDiffScore(
  colorA: string | null,
  colorB: string | null
): number | undefined {
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

// Converts a hex string to rgb format.
export function hexToRGB(hexString: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexString)
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}
