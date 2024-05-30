import { ColorKeys } from 'ui/src/theme'
import ImageColors from './rn-image-colors'

export type ExtractedColors = {
  primary?: string
  secondary?: string
  base?: string
  detail?: string
}

export async function getExtractedColors(
  imageUrl: Maybe<string>,
  fallback: ColorKeys = 'accent1',
  cache = true
): Promise<ExtractedColors | undefined> {
  if (!imageUrl) {
    return
  }

  const imageColors = await ImageColors.getColors(imageUrl, {
    key: imageUrl,
    ...(fallback && { fallback }),
    ...(cache && { cache }),
  })

  switch (imageColors.platform) {
    case 'android':
      return {
        primary: imageColors.dominant,
        base: imageColors.average,
        detail: imageColors.vibrant,
      }
    case 'ios':
      return {
        primary: imageColors.primary,
        secondary: imageColors.secondary,
        base: imageColors.background,
        detail: imageColors.detail,
      }
    case 'web':
      return {
        primary: imageColors.dominant,
        detail: imageColors.vibrant,
      }
  }

  return
}
