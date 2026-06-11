import { useEffect, useMemo, useState } from 'react'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { useColorSchemeFromSeed } from 'ui/src/utils/colors/hooks/useColorSchemeFromSeed'
import { useExtractedColors } from 'ui/src/utils/colors/hooks/useExtractedColors'
import { getSpecialCaseTokenColor } from 'ui/src/utils/colors/utils/getSpecialCaseTokenColor'
import { pickContrastPassingTokenColor } from 'ui/src/utils/colors/utils/pickContrastPassingTokenColor'
import { isSVGUri } from 'utilities/src/format/urls'

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

  // Without this, internal state keeps the previous image's color when the URL changes and the new
  // extraction yields no palette (the sync effect below never calls setTokenColor).
  useEffect(() => {
    if (!imageUrl) {
      return
    }
    setTokenColor(defaultColor)
    setTokenColorLoading(true)
  }, [imageUrl, defaultColor])

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
