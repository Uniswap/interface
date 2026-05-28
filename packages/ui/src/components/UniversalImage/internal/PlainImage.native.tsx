import { Image as ExpoImage, type ImageContentFit } from 'expo-image'
import { useState } from 'react'
import { Image } from 'react-native'
import { useImageSettings } from 'ui/src/components/UniversalImage/ImageSettingsContext'
import {
  type PlainImageExpoProps,
  type PlainImageProps,
  UniversalImageResizeMode,
} from 'ui/src/components/UniversalImage/types'

export function PlainImage(props: PlainImageProps): JSX.Element {
  const { uri, size, fallback, resizeMode, style, testID, onLoad, onError } = props

  const [hasError, setHasError] = useState(false)

  const { enableExpoImage } = useImageSettings()
  if (enableExpoImage) {
    return <PlainImageExpo {...props} />
  }

  if (hasError && fallback) {
    return fallback
  }

  return (
    <Image
      height={size.height}
      resizeMode={resizeMode}
      source={{ uri }}
      // TODO(apps-infra): Remove the flex: 1 property here.
      // It's not related to the image aspect ratio and causes odd behavior in some cases.
      style={{ aspectRatio: size.aspectRatio, flex: size.aspectRatio ? 1 : undefined, ...style }}
      testID={testID}
      width={size.width}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
      onLoad={onLoad}
    />
  )
}

const RESIZE_MODE_TO_CONTENT_FIT: Record<UniversalImageResizeMode, ImageContentFit> = {
  [UniversalImageResizeMode.Cover]: 'cover',
  [UniversalImageResizeMode.Contain]: 'contain',
  [UniversalImageResizeMode.Stretch]: 'fill',
  [UniversalImageResizeMode.Center]: 'none',
}

export function PlainImageExpo({
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
  const [hasError, setHasError] = useState(false)

  if (hasError && fallback) {
    return fallback
  }

  const contentFit = resizeMode ? RESIZE_MODE_TO_CONTENT_FIT[resizeMode] : undefined

  return (
    <ExpoImage
      // recyclingKey lets expo-image dispose the previous bitmap if this component is reused
      recyclingKey={uri}
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
      onError={() => {
        setHasError(true)
        onError?.()
      }}
      onLoad={onLoad}
    />
  )
}
