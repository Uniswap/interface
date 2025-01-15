import ImageColors from 'ui/src/utils/colors/rn-image-colors'

export type ExtractedColors = {
  primary?: string
  secondary?: string
  base?: string
  detail?: string
}

export type ColorStrategy = 'vibrant' | 'muted'

type ExtractedColorsOptions = {
  fallback?: string
  cache?: boolean
  colorStrategy?: ColorStrategy
}

export async function getExtractedColors(
  imageUrl: Maybe<string>,
  { fallback = 'accent1', cache = true, colorStrategy = 'vibrant' }: ExtractedColorsOptions,
): Promise<ExtractedColors | undefined> {
  if (!imageUrl) {
    return undefined
  }

  const imageColors: Record<string, string | undefined> = await ImageColors.getColors(imageUrl, {
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
    return applyColorStrategy(imageColors, colorStrategy)
  }

  if (imageColors.platform === 'web') {
    return {
      primary: imageColors.dominant,
      detail: imageColors.vibrant,
    }
  }

  return undefined
}

function applyColorStrategy(imageColors: Record<string, string | undefined>, strategy: ColorStrategy): ExtractedColors {
  switch (strategy) {
    case 'vibrant':
      return {
        primary: imageColors.primary,
        secondary: imageColors.secondary,
        base: imageColors.background,
        detail: imageColors.detail,
      }
    case 'muted':
      return {
        primary: imageColors.dominant,
        secondary: imageColors.secondary,
        base: imageColors.average,
        detail: imageColors.detail,
      }
    default:
      return {}
  }
}
