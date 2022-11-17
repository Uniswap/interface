import { useEffect, useState } from 'react'
import ImageColors from 'react-native-image-colors'
import { IOSImageColors } from 'react-native-image-colors/lib/typescript/types'
import { useAppTheme } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { Theme } from 'src/styles/theme'
import { assert } from 'src/utils/validation'

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

export async function extractColors(imageUrl: string, fallback: string) {
  const result = await ImageColors.getColors(imageUrl, {
    fallback,
    cache: true,
    key: imageUrl,
  })
  return result
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
