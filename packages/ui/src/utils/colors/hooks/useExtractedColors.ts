import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import type { ThemeKeys } from 'ui/src/index'
import type { ColorStrategy, ExtractedColors } from 'ui/src/utils/colors/types'
import { getExtractedColors } from 'ui/src/utils/colors/utils/getExtractedColors'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

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
