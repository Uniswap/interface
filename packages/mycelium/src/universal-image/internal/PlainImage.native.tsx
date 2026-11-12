import { Image as ExpoImage, type ImageContentFit } from 'expo-image'
import type { JSX } from 'react'
import { useImageLoadError } from '../hooks/useImageLoadError'
import { type PlainImageExpoProps, UniversalImageResizeMode } from '../types'

const RESIZE_MODE_TO_CONTENT_FIT: Record<UniversalImageResizeMode, ImageContentFit> = {
  [UniversalImageResizeMode.Cover]: 'cover',
  [UniversalImageResizeMode.Contain]: 'contain',
  [UniversalImageResizeMode.Stretch]: 'fill',
  [UniversalImageResizeMode.Center]: 'none',
}

export function PlainImage({
  alt,
  autoplay,
  cacheInMemory,
  fallback,
  onError,
  onLoad,
  priority,
  resizeMode,
  size,
  style,
  testID,
  transitionMs,
  uri,
}: PlainImageExpoProps): JSX.Element {
  const { hasError, handleError } = useImageLoadError(uri, onError)

  if (hasError && fallback) {
    return fallback
  }

  const contentFit = resizeMode ? RESIZE_MODE_TO_CONTENT_FIT[resizeMode] : undefined

  return (
    <ExpoImage
      // remount on uri change: a stale onError for the old source can fire after the new source
      // commits to the same instance, which would mark the new uri as errored
      key={uri}
      // recyclingKey lets expo-image dispose the previous bitmap if this component is reused
      recyclingKey={uri}
      accessible={alt !== ''}
      alt={alt || undefined}
      autoplay={autoplay}
      cachePolicy={cacheInMemory ? 'memory-disk' : 'disk'}
      contentFit={contentFit}
      priority={priority}
      source={{ uri }}
      style={{
        aspectRatio: size.aspectRatio,
        width: size.width,
        height: size.height,
        ...style,
      }}
      testID={testID}
      transition={transitionMs ?? 200}
      onError={handleError}
      onLoad={onLoad}
    />
  )
}
