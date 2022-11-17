import { useEffect, useState } from 'react'
import ImageColors from 'react-native-image-colors'
import { IOSImageColors } from 'react-native-image-colors/lib/typescript/types'
import { useAppTheme } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { theme as FixedTheme, Theme } from 'src/styles/theme'
import { assert } from 'src/utils/validation'
import { hex } from 'wcag-contrast'

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

/** Helper to retrieve foreground and background colors for a given chain */
export function useNetworkColors(chainId: ChainId) {
  const theme = useAppTheme()

  const foreground = theme.colors[`chain_${chainId}`]
  assert(foreground, 'Network color is not defined in Theme')

  return {
    foreground,
    background: opacify(10, foreground),
  }
}

export type ExtractedColors = Pick<
  IOSImageColors,
  'background' | 'detail' | 'secondary' | 'primary'
>

export function useExtractedColors(
  imageUrl: NullUndefined<string>,
  fallback: keyof Theme['colors'] = 'magentaVibrant',
  cache: boolean = true
) {
  const [colors, setColors] = useState<ExtractedColors | null>(null)
  const [colorsLoading, setColorsLoading] = useState(true)

  useEffect(() => {
    if (!imageUrl) return

    setColorsLoading(true)

    ImageColors.getColors(imageUrl, {
      fallback,
      cache: cache,
      key: imageUrl,
    }).then((result) => {
      const { background, detail, secondary, primary } = result as IOSImageColors
      setColors({
        background: background,
        detail: detail,
        secondary: secondary,
        primary: primary,
      })
    })
    setColorsLoading(false)
  }, [imageUrl, fallback, cache])

  return { colors, colorsLoading }
}

/**
 * Picks a contrast-passing color from a given token image URL and background color.
 * The color extracting library will return a few options, and this function will
 * try to pick the best of those given options.
 *
 * Usage:
 *
 * ```ts
 * const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
 *    tokenImageUrl,
 *    theme.colors.background0,
 *    theme.colors.textTertiary
 * )
 * ```
 *
 * @param imageUrl The URL of the image to extract a color from
 * @param backgroundColor The hex value of the background color to check contrast against
 * @param defaultColor The color that will be returned while the extraction is still loading
 * @returns The extracted color as a hex code string
 */
export function useExtractedTokenColor(
  imageUrl: NullUndefined<string>,
  backgroundColor: string,
  defaultColor: string
) {
  const { colors, colorsLoading } = useExtractedColors(imageUrl)
  const [tokenColor, setTokenColor] = useState(defaultColor)
  const [tokenColorLoading, setTokenColorLoading] = useState(true)

  useEffect(() => {
    if (!colorsLoading && colors !== null) {
      setTokenColor(pickContrastPassingColor(colors, backgroundColor))
      setTokenColorLoading(false)
    }
  }, [backgroundColor, colors, colorsLoading])

  if (!imageUrl) {
    return { tokenColor: null, tokenColorLoading: false }
  }

  return { tokenColor, tokenColorLoading }
}

/**
 * Picks a contrast-passing text color to put on top of a given background color.
 * The threshold right now is 3.0, which is the WCAG AA standard.
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns either 'textOnBrightPrimary' or 'textOnDimPrimary'
 */
export function getContrastPassingTextColor(backgroundColor: string) {
  const contrastThreshold = 3

  const lightText = FixedTheme.colors.textOnBrightPrimary

  if (hex(lightText, backgroundColor) >= contrastThreshold) {
    return 'textOnBrightPrimary'
  }
  return 'textOnDimPrimary'
}

function passesContrast(color: string, backgroundColor: string, contrastThreshold: number) {
  // sometimes the extracted colors come back as black or white, discard those
  if (color === '#000000' || color === '#FFFFFF') {
    return false
  }

  const contrast = hex(color, backgroundColor)
  return contrast >= contrastThreshold
}

/**
 * Picks a contrast-passing color from a given few that are returned from the color extraction library.
 * The threshold right now is 1.95, which is a little bit less strict than when picking text to go on top
 * of a color, because with the limitations of the color extraction library, a slightly lower threshold
 * leads to better results right now.
 * @param extractedColors An object of `background`, `primary`, `detail`, and `secondary` colors that
 * the color extraction library returns for a given image URL
 * @param backgroundHex The hex value of the background color to check the contrast of the resulting
 * color against
 * @returns a hex code that will pass a contrast check against the background
 */
function pickContrastPassingColor(extractedColors: ExtractedColors, backgroundHex: string) {
  const contrastThreshold = 1.95

  const { background, detail, secondary, primary } = extractedColors

  // TODO(MOB-3693): Define more robust color extraction logic. Some ideas:
  // - compute all extracted colors and find the highest contrast one (that isn't #000000 or #FFFFFF)
  // - bump color until it passes contrast: e.g. `import { lighten, desaturate } from 'polished'`
  // - locally cache the result with the image logo URL as a key
  // - move this logic to the backend

  if (passesContrast(background, backgroundHex, contrastThreshold)) {
    return background
  }
  if (passesContrast(primary, backgroundHex, contrastThreshold)) {
    return primary
  }
  if (passesContrast(detail, backgroundHex, contrastThreshold)) {
    return detail
  }
  if (passesContrast(secondary, backgroundHex, contrastThreshold)) {
    return secondary
  }

  return FixedTheme.colors.magentaVibrant
}
