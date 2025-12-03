import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import type { ThemeKeys } from 'ui/src/index'
import { type ColorTokens } from 'ui/src/index'
import { colorsDark, colorsLight } from 'ui/src/theme'
import type { ColorStrategy, ExtractedColors } from 'ui/src/utils/colors/getExtractedColors'
import { getExtractedColors } from 'ui/src/utils/colors/getExtractedColors'
import { SPECIAL_CASE_TOKEN_COLORS } from 'ui/src/utils/colors/specialCaseTokens'
import { isSVGUri } from 'utilities/src/format/urls'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hex } from 'wcag-contrast'

/** The contrast threshold for token colors is currently lower than the WCAG AA standard of 3.0 because a slightly lower threshold leads to better results right now due to imitations of the color extraction library. */
const MIN_TOKEN_COLOR_CONTRAST_THRESHOLD = 1.95

const blackAndWhiteSpecialCase: Set<string> = new Set([
  // QNT
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4a220E6096B25EADb88358cb44068A3248254675/logo.png',
  // Xen
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8/logo.png',
  // FWB
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x35bD01FC9d6D5D81CA9E055Db88Dc49aa2c699A8/logo.png',
])

type ExtractedColorsOptions = {
  fallback: ThemeKeys
  cache?: boolean
  colorStrategy?: ColorStrategy
}

export function useExtractedColors(
  imageUrl: Maybe<string>,
  options: ExtractedColorsOptions = { fallback: 'accent1', cache: true },
): { colors?: ExtractedColors; colorsLoading: boolean } {
  const sporeColors = useSporeColors()
  const getImageColors = useCallback(
    async () =>
      getExtractedColors(imageUrl, {
        fallback: sporeColors[options.fallback].val,
        cache: options.cache,
        colorStrategy: options.colorStrategy,
      }),
    [imageUrl, options.fallback, options.cache, sporeColors, options.colorStrategy],
  )

  const { data: colors, isLoading: colorsLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.ExtractedColors, imageUrl],
    queryFn: getImageColors,
    enabled: !!imageUrl,
  })

  return { colors, colorsLoading }
}

function getSpecialCaseTokenColor(imageUrl: Maybe<string>, isDarkMode: boolean): Nullable<string> {
  if (imageUrl && blackAndWhiteSpecialCase.has(imageUrl)) {
    return isDarkMode ? '#FFFFFF' : '#000000'
  }

  if (!imageUrl || !SPECIAL_CASE_TOKEN_COLORS[imageUrl]) {
    return null
  }

  return SPECIAL_CASE_TOKEN_COLORS[imageUrl]
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
 *    theme.colors.surface1,
 *    theme.colors.neutral3
 * )
 * ```
 *
 * @param imageUrl The URL of the image to extract a color from
 * @param tokenName The ticker of the asset (used to derive a color when no logo is available)
 * @param backgroundColor The hex value of the background color to check contrast against
 * @param defaultColor The color that will be returned while the extraction is still loading
 * @returns The extracted color as a hex code string
 */
export function useExtractedTokenColor({
  imageUrl,
  tokenName,
  backgroundColor,
  defaultColor,
}: {
  imageUrl: Maybe<string>
  tokenName: Maybe<string>
  backgroundColor: string
  defaultColor: string
}): { tokenColor: Nullable<string>; tokenColorLoading: boolean } {
  const sporeColors = useSporeColors()
  const { colors, colorsLoading } = useExtractedColors(imageUrl)
  const [tokenColor, setTokenColor] = useState(defaultColor)
  const [tokenColorLoading, setTokenColorLoading] = useState(true)
  const isDarkMode = useIsDarkMode()
  const { foreground } = useColorSchemeFromSeed(tokenName ?? '')

  useEffect(() => {
    if (!colorsLoading) {
      setTokenColorLoading(false)
      if (colors !== undefined) {
        const pickedColor = pickContrastPassingTokenColor({
          extractedColors: colors,
          backgroundHex: backgroundColor,
          isDarkMode,
        })

        setTokenColor(pickedColor)
      }
    }
  }, [backgroundColor, colors, colorsLoading, isDarkMode])

  const specialCaseTokenColor = useMemo(() => {
    return getSpecialCaseTokenColor(imageUrl, isDarkMode)
  }, [imageUrl, isDarkMode])

  if (specialCaseTokenColor) {
    return { tokenColor: specialCaseTokenColor, tokenColorLoading: false }
  }

  if (isSVGUri(imageUrl)) {
    // Fall back to a more neutral color for SVG's since they fail extraction but we can render them elsewhere

    return { tokenColor: sporeColors.neutral1.val, tokenColorLoading: false }
  }

  if (!imageUrl) {
    return { tokenColor: foreground, tokenColorLoading: false }
  }

  return { tokenColor, tokenColorLoading }
}

enum LOGOLESS_COLORS {
  PINK = 'PINK',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  TURQUOISE = 'TURQUOISE',
  CYAN = 'CYAN',
  BLUE = 'BLUE',
  PURPLE = 'PURPLE',
}

type TamaguiColor =
  | ColorTokens
  | 'transparent'
  | `rgba(${string})`
  | `rgb(${string})`
  | `hsl(${string})`
  | `hsla(${string})`
  | `#${string}`

type ColorScheme = {
  light: { foreground: TamaguiColor; background: TamaguiColor }
  dark: { foreground: TamaguiColor; background: TamaguiColor }
}

type LogolessColorSchemes = {
  [key in LOGOLESS_COLORS]: ColorScheme
}

const logolessColorSchemes: LogolessColorSchemes = {
  // TODO (MOB-2417): update the colors in the global colors file to these and pull from there
  [LOGOLESS_COLORS.PINK]: {
    light: { foreground: '#FC74FE', background: '#FEF4FF' },
    dark: { foreground: '#FC74FE', background: '#361A37' },
  },
  [LOGOLESS_COLORS.ORANGE]: {
    light: { foreground: '#FF7715', background: '#FFF2F1' },
    dark: { foreground: '#FF7715', background: '#2E0805' },
  },
  [LOGOLESS_COLORS.YELLOW]: {
    light: { foreground: '#FFBF17', background: '#FFFCF2' },
    dark: { foreground: '#FFF612', background: '#1F1E02' },
  },
  [LOGOLESS_COLORS.GREEN]: {
    light: { foreground: '#2FBA61', background: '#EEFBF1' },
    dark: { foreground: '#2FBA61', background: '#0F2C1A' },
  },
  [LOGOLESS_COLORS.TURQUOISE]: {
    light: { foreground: '#00C3A0', background: '#F7FEEB' },
    dark: { foreground: '#5CFE9D', background: '#1A2A21' },
  },
  [LOGOLESS_COLORS.CYAN]: {
    light: { foreground: '#2ABDFF', background: '#EBF8FF' },
    dark: { foreground: '#2ABDFF', background: '#15242B' },
  },
  [LOGOLESS_COLORS.BLUE]: {
    light: { foreground: '#3271FF', background: '#EFF4FF' },
    dark: { foreground: '#3271FF', background: '#10143D' },
  },
  [LOGOLESS_COLORS.PURPLE]: {
    light: { foreground: '#9E62FF', background: '#FAF5FF' },
    dark: { foreground: '#9E62FF', background: '#1A0040' },
  },
}

function getLogolessColorIndex(tokenName: string, numOptions: number): number {
  const charCodes = Array.from(tokenName).map((char) => char.charCodeAt(0))
  const sum = charCodes.reduce((acc, curr) => acc + curr, 0)
  return sum % numOptions
}

/**
 * Picks a color scheme for a token that doesn't have a logo.
 * The color scheme is derived from the characters of the token name and will only change if the name changes
 * @param tokenName The name of the token
 * @returns a light and dark version of a color scheme with a foreground and background color
 */
function useLogolessColorScheme(tokenName: string): ColorScheme {
  return useMemo(() => {
    const index = getLogolessColorIndex(tokenName, Object.keys(LOGOLESS_COLORS).length)

    return logolessColorSchemes[LOGOLESS_COLORS[Object.keys(LOGOLESS_COLORS)[index] as keyof typeof LOGOLESS_COLORS]]
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

  const contrast = hex(color, backgroundColor)
  return contrast >= contrastThreshold
}

/**
 * Determines if a color is gray (all RGB values are close to each other).
 * @param color The hex or rgb color to check
 * @returns boolean indicating if the color is gray
 */
export function isGrayColor(color: Maybe<string>): boolean {
  if (!color) {
    return false
  }

  let r: number
  let g: number
  let b: number

  if (color.startsWith('#')) {
    if (color.length < 7) {
      return false
    }

    r = parseInt(color.slice(1, 3), 16)
    g = parseInt(color.slice(3, 5), 16)
    b = parseInt(color.slice(5, 7), 16)
  } else if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (!rgbMatch || !rgbMatch[1] || !rgbMatch[2] || !rgbMatch[3]) {
      return false
    }

    r = parseInt(rgbMatch[1], 10)
    g = parseInt(rgbMatch[2], 10)
    b = parseInt(rgbMatch[3], 10)
  } else {
    return false
  }

  // Calculate the maximum difference between any two RGB components
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b))

  // If the max difference is less than this threshold, the color is considered gray
  return maxDiff < 10
}

/**
 * Picks a contrast-passing color from a given few that are returned from the color extraction library.
 *
 * @param extractedColors An object of `background`, `primary`, `detail`, and `secondary` colors that
 * the color extraction library returns for a given image URL
 * @param backgroundHex The hex value of the background color to check the contrast of the resulting
 * color against
 * @returns a hex code that will pass a contrast check against the background
 */
function pickContrastPassingTokenColor({
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

  // TODO(MOB-643): Define more robust color extraction logic. Some ideas:
  // - compute all extracted colors and find the highest contrast one (that isn't #000000 or #FFFFFF)
  // - bump color until it passes contrast: e.g. `import { lighten, desaturate } from 'polished'`
  // - locally cache the result with the image logo URL as a key
  // - move this logic to the backend
  for (const c of colorsInOrder) {
    if (
      !!c &&
      passesContrast({
        color: c,
        backgroundColor: backgroundHex,
        contrastThreshold: MIN_TOKEN_COLOR_CONTRAST_THRESHOLD,
      })
    ) {
      // If the color passes contrast but is gray, use a stronger color instead
      if (isGrayColor(c)) {
        return isDarkMode ? colorsDark.neutral1 : colorsLight.neutral1
      }
      return c
    }
  }

  return isDarkMode ? colorsDark.accent1 : colorsLight.accent1
}

export function getHoverCssFilter({
  isDarkMode = false,
  differenceFrom1 = 0.05,
}: {
  isDarkMode?: boolean
  differenceFrom1?: number
}): string {
  return isDarkMode ? `brightness(${1 + differenceFrom1})` : `brightness(${1 - differenceFrom1})`
}

export * from './getContrastPassingTextColor'
export * from './useColorsFromTokenColor'
