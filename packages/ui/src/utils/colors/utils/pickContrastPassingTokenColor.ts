import { colorsDark, colorsLight } from 'ui/src/theme'
import type { ExtractedColors } from 'ui/src/utils/colors/types'
import { getRelativeLuminance } from 'ui/src/utils/colors/utils/getRelativeLuminance'
import { isGrayColor } from 'ui/src/utils/colors/utils/isGrayColor'
import { passesContrast } from 'ui/src/utils/colors/utils/passesContrast'

/** The contrast threshold for token colors is currently lower than the WCAG AA standard of 3.0 because a slightly lower threshold leads to better results right now due to imitations of the color extraction library. */
const MIN_TOKEN_COLOR_CONTRAST_THRESHOLD = 1.95

/** Above this background luminance we treat the surface as "light" for swatch preference heuristics. */
const LIGHT_BACKGROUND_LUMA_THRESHOLD = 0.45

/**
 * On light backgrounds, extracted "vibrant" swatches are often dark logo rings that pass contrast before
 * brand fills (e.g. BNB). Prefer swatches at least this bright when another passing option exists.
 */
const MIN_SWATCH_LUMA_ON_LIGHT_BG = 0.22

/**
 * On dark backgrounds, prefer swatches that are not near-white highlights when a darker alternative also passes.
 */
const MAX_SWATCH_LUMA_ON_DARK_BG = 0.78

/**
 * When a strict-contrast dark swatch exists on a light surface, allow slightly lower contrast for bright
 * brand fills (e.g. BNB gold on white is ~1.77:1 vs strict 1.95) so they can win over dark logo rings.
 */
const SOFT_MIN_TOKEN_COLOR_CONTRAST_ON_LIGHT_BG = 1.45

/**
 * Picks a contrast-passing color from a given few that are returned from the color extraction library.
 *
 * @param extractedColors An object of `background`, `primary`, `detail`, and `secondary` colors that
 * the color extraction library returns for a given image URL
 * @param backgroundHex The hex value of the background color to check the contrast of the resulting
 * color against
 * @returns a hex code that will pass a contrast check against the background
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
    return isDarkMode ? colorsDark.accent1 : colorsLight.accent1
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

  // TODO(MOB-643): Define more robust color extraction logic. Some ideas:
  // - compute all extracted colors and find the highest contrast one (that isn't #000000 or #FFFFFF)
  // - bump color until it passes contrast: e.g. `import { lighten, desaturate } from 'polished'`
  // - locally cache the result with the image logo URL as a key
  // - move this logic to the backend
  // Prefer a non-gray swatch first so dark near-neutral "rings" do not trigger the gray→neutral1 shortcut
  // before brighter brand colors later in the ordered list (e.g. BNB).
  for (const skipGray of [true, false]) {
    for (const c of colorsInOrder) {
      if (!c || !passesForPick(c) || !allowColor(c)) {
        continue
      }

      if (isGrayColor(c)) {
        if (skipGray) {
          continue
        }
        return isDarkMode ? colorsDark.neutral1 : colorsLight.neutral1
      }
      return c
    }
  }

  return isDarkMode ? colorsDark.accent1 : colorsLight.accent1
}
