/* eslint-disable max-lines */
import { useCallback, useEffect, useMemo, useState } from 'react'
import ImageColors from 'react-native-image-colors'
import { useIsDarkMode, useSporeColors } from 'ui/src'
import { ColorKeys, colors as GlobalColors, GlobalPalette, colorsLight } from 'ui/src/theme'
import { assert } from 'utilities/src/errors'
import { isSVGUri } from 'utilities/src/format/urls'
import { useAsyncData } from 'utilities/src/react/hooks'
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

export type ExtractedColors = {
  primary?: string
  secondary?: string
  base?: string
  detail?: string
}

const specialCaseTokenColors: { [key: string]: string } = {
  // old WBTC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png':
    '#F09241',
  // new WBTC
  'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744':
    '#F09241',
  // DAI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png':
    '#FAB01B',
  // UNI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png':
    '#E6358C',
  // BUSD
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4Fabb145d64652a948d72533023f6E7A623C7C53/logo.png':
    '#EFBA09',
  // AI-X
  'https://s2.coinmarketcap.com/static/img/coins/64x64/26984.png': '#29A1F1',
  // ETH
  'https://token-icons.s3.amazonaws.com/eth.png': '#4970D5',
  // HARRYPOTTERSHIBAINUBITCOIN
  'https://assets.coingecko.com/coins/images/30323/large/hpos10i_logo_casino_night-dexview.png?1684117567':
    '#DE3110',
  // PEPE
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png':
    '#3EAE14',
  // Unibot V2
  'https://s2.coinmarketcap.com/static/img/coins/64x64/25436.png': '#4A0A4F',
  // UNIBOT v1
  'https://assets.coingecko.com/coins/images/30462/small/logonoline_%281%29.png?1687510315':
    '#4A0A4F',
  // USDC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png':
    '#0066D9',
  // HEX
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39/logo.png':
    '#F93F8C',
  // MONG
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1ce270557C1f68Cfb577b856766310Bf8B47FD9C/logo.png':
    '#A96DFF',
  // ARB
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1/logo.png':
    '#29A1F1',
  // PSYOP
  'https://s2.coinmarketcap.com/static/img/coins/64x64/25422.png': '#E88F00',
  // MATIC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png':
    '#A96DFF',
  // TURBO
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA35923162C49cF95e6BF26623385eb431ad920D3/logo.png':
    '#BD6E29',
  // AIDOGE
  'https://assets.coingecko.com/coins/images/29852/large/photo_2023-04-18_14-25-28.jpg?1681799160':
    '#29A1F1',
  // SIMPSON
  'https://assets.coingecko.com/coins/images/30243/large/1111.png?1683692033': '#E88F00',
  // MAKER
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png':
    '#50B197',
  // OX
  'https://assets.coingecko.com/coins/images/30604/large/Logo2.png?1685522119': '#2959D9',
  // ANGLE
  'https://assets.coingecko.com/coins/images/19060/large/ANGLE_Token-light.png?1666774221':
    '#FF5555',
  // APE
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png':
    '#054AA9',
  // GUSD
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd/logo.png':
    '#00A4BD',
  // OGN
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26/logo.png':
    '#054AA9',
  // RPL
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xD33526068D116cE69F19A9ee46F0bd304F21A51f/logo.png':
    '#FF7B4F',
}

const blackAndWhiteSpecialCase: Set<string> = new Set([
  // QNT
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4a220E6096B25EADb88358cb44068A3248254675/logo.png',
  // Xen
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8/logo.png',
  // FWB
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x35bD01FC9d6D5D81CA9E055Db88Dc49aa2c699A8/logo.png',
])

export function useExtractedColors(
  imageUrl: Maybe<string>,
  fallback: ColorKeys = 'accent1',
  cache = true
): { colors?: ExtractedColors; colorsLoading: boolean } {
  const getImageColors = useCallback(async () => {
    if (!imageUrl) {
      return
    }

    const imageColors = await ImageColors.getColors(imageUrl, {
      key: imageUrl,
      ...(fallback && { fallback }),
      ...(cache && { cache }),
    })

    if (imageColors.platform === 'android') {
      return {
        primary: imageColors.dominant,
        base: imageColors.average,
        detail: imageColors.vibrant,
      }
    }

    if (imageColors.platform === 'ios') {
      return {
        primary: imageColors.primary,
        secondary: imageColors.secondary,
        base: imageColors.background,
        detail: imageColors.detail,
      }
    }
  }, [imageUrl, fallback, cache])

  const { data: colors, isLoading: colorsLoading } = useAsyncData(getImageColors)

  return { colors, colorsLoading }
}

function getSpecialCaseTokenColor(imageUrl: Maybe<string>, isDarkMode: boolean): Nullable<string> {
  if (imageUrl && blackAndWhiteSpecialCase.has(imageUrl)) {
    return isDarkMode ? '#FFFFFF' : '#000000'
  }

  if (!imageUrl || !specialCaseTokenColors[imageUrl]) {
    return null
  }

  return specialCaseTokenColors[imageUrl] ?? null
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
export function useExtractedTokenColor(
  imageUrl: Maybe<string>,
  tokenName: Maybe<string>,
  backgroundColor: string,
  defaultColor: string
): { tokenColor: Nullable<string>; tokenColorLoading: boolean } {
  const sporeColors = useSporeColors()
  const { colors, colorsLoading } = useExtractedColors(imageUrl)
  const [tokenColor, setTokenColor] = useState(defaultColor)
  const [tokenColorLoading, setTokenColorLoading] = useState(true)
  const isDarkMode = useIsDarkMode()
  const logolessColorScheme = useLogolessColorScheme(tokenName ?? '')

  useEffect(() => {
    if (!colorsLoading && !!colors) {
      setTokenColor(pickContrastPassingColor(colors, backgroundColor))
      setTokenColorLoading(false)
    }
  }, [backgroundColor, colors, colorsLoading])

  const specialCaseTokenColor = useMemo(() => {
    return getSpecialCaseTokenColor(imageUrl, isDarkMode)
  }, [imageUrl, isDarkMode])

  if (specialCaseTokenColor) {
    return { tokenColor: specialCaseTokenColor, tokenColorLoading: false }
  }

  if (isSVGUri(imageUrl)) {
    // Fall back to a more neutral color for SVG's since they fail extraction but we can render them elsewhere
    return { tokenColor: sporeColors.neutral1?.val, tokenColorLoading: false }
  }

  if (!imageUrl) {
    const { foreground } = isDarkMode ? logolessColorScheme.dark : logolessColorScheme.light
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

type ColorScheme = {
  light: { foreground: string; background: string }
  dark: { foreground: string; background: string }
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
export function useLogolessColorScheme(tokenName: string): ColorScheme {
  return useMemo(() => {
    const index = getLogolessColorIndex(tokenName, Object.keys(LOGOLESS_COLORS).length)
    return logolessColorSchemes[
      LOGOLESS_COLORS[Object.keys(LOGOLESS_COLORS)[index] as keyof typeof LOGOLESS_COLORS]
    ]
  }, [tokenName])
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

export function passesContrast(
  color: string,
  backgroundColor: string,
  contrastThreshold: number
): boolean {
  // sometimes the extracted colors come back as black or white, discard those
  if (!color || color === '#000000' || color === '#FFFFFF') {
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
function pickContrastPassingColor(extractedColors: ExtractedColors, backgroundHex: string): string {
  const contrastThreshold = 1.95

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
    if (!!c && passesContrast(c, backgroundHex, contrastThreshold)) {
      return c
    }
  }

  return colorsLight.accent1
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
