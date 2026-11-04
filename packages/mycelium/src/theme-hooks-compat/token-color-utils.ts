/**
 * Pure color utilities for useExtractedTokenColor, ported from ui/src/utils/colors; parity-pinned.
 * passesContrast computes the WCAG ratio locally instead of via wcag-contrast — same math, no new dependency.
 */
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from './theme-colors'

/** The color-extraction result shape (`ui/src/utils/colors/types.ts` ExtractedColors). */
export type ExtractedColors = {
  primary?: string
  secondary?: string
  base?: string
  detail?: string
}

/** `ui/src/utils/colors/types.ts` ColorStrategy. */
export type ColorStrategy = 'vibrant' | 'muted'

export function parseRgb888(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    if (color.length < 7) {
      return null
    }

    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    }
  }

  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (!rgbMatch?.[1] || !rgbMatch[2] || !rgbMatch[3]) {
      return null
    }

    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/** WCAG 2.1 relative luminance in [0, 1], or null if the color format is unsupported. */
export function getRelativeLuminance(color: string | null | undefined): number | null {
  if (!color) {
    return null
  }

  const rgb = parseRgb888(color)
  if (!rgb) {
    return null
  }

  const toLinear = (channel: number): number => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  const R = toLinear(rgb.r)
  const G = toLinear(rgb.g)
  const B = toLinear(rgb.b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** Whether a color is gray (all RGB channels within 10 of each other) — legacy isGrayColor. */
export function isGrayColor(color: string | null | undefined): boolean {
  if (!color) {
    return false
  }

  const rgb = parseRgb888(color)
  if (!rgb) {
    return false
  }

  const { r, g, b } = rgb
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b))
  return maxDiff < 10
}

/** WCAG contrast ratio between two colors, or null when either fails to parse. */
function contrastRatio(colorA: string, colorB: string): number | null {
  const lumA = getRelativeLuminance(colorA)
  const lumB = getRelativeLuminance(colorB)
  if (lumA === null || lumB === null) {
    return null
  }
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

export function passesContrast({
  color,
  backgroundColor,
  contrastThreshold,
}: {
  color: string
  backgroundColor: string
  contrastThreshold: number
}): boolean {
  // sometimes the extracted colors come back as black or white, discard those
  if (!color || color === '#000000' || color === '#FFFFFF') {
    return false
  }

  const contrast = contrastRatio(color, backgroundColor)
  return contrast !== null && contrast >= contrastThreshold
}

/** Below the WCAG AA 3.0 on purpose — legacy comment: better results with the current extraction library. */
const MIN_TOKEN_COLOR_CONTRAST_THRESHOLD = 1.95

/** Above this background luminance we treat the surface as "light" for swatch preference heuristics. */
const LIGHT_BACKGROUND_LUMA_THRESHOLD = 0.45

/**
 * On light backgrounds, extracted "vibrant" swatches are often dark logo rings
 * that pass contrast before brand fills (e.g. BNB). Prefer swatches at least
 * this bright when another passing option exists.
 */
const MIN_SWATCH_LUMA_ON_LIGHT_BG = 0.22

/** On dark backgrounds, prefer swatches that are not near-white highlights when a darker alternative also passes. */
const MAX_SWATCH_LUMA_ON_DARK_BG = 0.78

/**
 * When a strict-contrast dark swatch exists on a light surface, allow slightly
 * lower contrast for bright brand fills (e.g. BNB gold on white) so they can
 * win over dark logo rings.
 */
const SOFT_MIN_TOKEN_COLOR_CONTRAST_ON_LIGHT_BG = 1.45

/**
 * Picks a contrast-passing color from the extraction result — the direct port
 * of `ui/src/utils/colors/utils/pickContrastPassingTokenColor.ts`, with the
 * theme fallbacks read from the generated Spore mirror instead of
 * `ui/src/theme` (value-identical, parity-pinned).
 */
export function pickContrastPassingTokenColor({
  extractedColors,
  backgroundHex,
  isDarkMode,
}: {
  extractedColors: ExtractedColors
  backgroundHex: string
  isDarkMode: boolean
}): string {
  const colorsInOrder = [
    extractedColors.base,
    extractedColors.detail,
    extractedColors.secondary,
    extractedColors.primary,
  ] as const

  const themeColors = isDarkMode ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
  const fallbackAccent1 = themeColors.accent1
  const fallbackNeutral1 = themeColors.neutral1

  const passesStrictContrast = (c: string): boolean =>
    passesContrast({
      color: c,
      backgroundColor: backgroundHex,
      contrastThreshold: MIN_TOKEN_COLOR_CONTRAST_THRESHOLD,
    })

  const bgLuma = getRelativeLuminance(backgroundHex)
  const hasStrictDarkSwatchOnLight =
    bgLuma !== null &&
    bgLuma > LIGHT_BACKGROUND_LUMA_THRESHOLD &&
    colorsInOrder.some((c) => {
      if (!c || !passesStrictContrast(c)) {
        return false
      }
      const l = getRelativeLuminance(c)
      return l !== null && l < MIN_SWATCH_LUMA_ON_LIGHT_BG
    })

  const passesSoftBrightOnLight = (c: string): boolean => {
    const l = getRelativeLuminance(c)
    return (
      l !== null &&
      l >= MIN_SWATCH_LUMA_ON_LIGHT_BG &&
      passesContrast({
        color: c,
        backgroundColor: backgroundHex,
        contrastThreshold: SOFT_MIN_TOKEN_COLOR_CONTRAST_ON_LIGHT_BG,
      })
    )
  }

  const passesForPick = (c: string): boolean =>
    passesStrictContrast(c) || (hasStrictDarkSwatchOnLight && passesSoftBrightOnLight(c))

  const passing = colorsInOrder.filter((c): c is string => !!c && passesForPick(c))

  if (passing.length === 0) {
    return fallbackAccent1
  }

  let allowColor: (c: string) => boolean = () => true

  if (bgLuma !== null && bgLuma > LIGHT_BACKGROUND_LUMA_THRESHOLD) {
    const brighterOptions = passing.filter((c) => {
      const l = getRelativeLuminance(c)
      return l !== null && l >= MIN_SWATCH_LUMA_ON_LIGHT_BG
    })
    if (brighterOptions.length > 0) {
      const brighterSet = new Set(brighterOptions)
      allowColor = (c) => brighterSet.has(c)
    }
  } else if (bgLuma !== null && bgLuma <= LIGHT_BACKGROUND_LUMA_THRESHOLD) {
    const darkerOptions = passing.filter((c) => {
      const l = getRelativeLuminance(c)
      return l !== null && l <= MAX_SWATCH_LUMA_ON_DARK_BG
    })
    if (darkerOptions.length > 0) {
      const darkerSet = new Set(darkerOptions)
      allowColor = (c) => darkerSet.has(c)
    }
  }

  // Prefer a non-gray swatch first so dark near-neutral "rings" do not trigger
  // the gray→neutral1 shortcut before brighter brand colors later in the
  // ordered list (e.g. BNB) — legacy TODO(MOB-643) tracks a robuster picker.
  for (const skipGray of [true, false]) {
    for (const c of colorsInOrder) {
      if (!c || !passesForPick(c) || !allowColor(c)) {
        continue
      }

      if (isGrayColor(c)) {
        if (skipGray) {
          continue
        }
        return fallbackNeutral1
      }
      return c
    }
  }

  return fallbackAccent1
}
