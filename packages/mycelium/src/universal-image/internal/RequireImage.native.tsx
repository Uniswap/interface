import { Image as ExpoImage } from 'expo-image'
import type { JSX } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useImageLoadError } from '../hooks/useImageLoadError'
import type { RequireImageProps } from '../types'

export function RequireImage({ alt, uri, size, style, fallback, onError }: RequireImageProps): JSX.Element {
  const { hasError, handleError } = useImageLoadError(uri, onError)

  if (hasError && fallback) {
    return fallback
  }

  return (
    <ExpoImage
      // remount on uri change: a stale onError for the old source can fire after the new source
      // commits to the same instance, which would mark the new uri as errored
      key={String(uri)}
      // recyclingKey lets expo-image dispose the previous bitmap if this component is reused
      recyclingKey={String(uri)}
      accessible={alt !== ''}
      alt={alt || undefined}
      source={uri}
      // The caller's image style must flow through: TokenLogo layers a white background circle
      // (explicit zIndex background, 96% size) under the logo and raises the image above it with
      // zIndex default in style.image. Dropping the style paints the image below the circle —
      // a blank white circle (only the logo's outer edge peeked out).
      style={{ height: size.height, width: size.width, ...style }}
      onError={() => {
        logger.warn('RequireImage.native', 'RequireImage', 'Failed to load require-source image', {
          data: { uri },
        })
        handleError()
      }}
    />
  )
}
