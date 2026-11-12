import type { JSX } from 'react'
import type { ViewStyle } from 'react-native'
import { isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { ImageLoadingFallback } from './internal/ImageLoadingFallback'
import { PlainImage } from './internal/PlainImage'
import { RequireImage } from './internal/RequireImage'
import { SvgImage } from './internal/SvgImage'
import { type UniversalImageProps } from './types'

export function UniversalImage({
  alt,
  uri,
  size,
  style,
  fallback,
  testID,
  onLoad,
  onError,
  allowLocalUri = false,
  autoplay = true,
  transitionMs,
  priority,
}: UniversalImageProps): JSX.Element | null {
  // Handle local require-source assets (numeric ids only exist on native; platform-split leaf)
  if (typeof uri === 'number') {
    return <RequireImage alt={alt} fallback={fallback} size={size} style={style?.image} uri={uri} onError={onError} />
  }

  // Use the fallback if no URI at all
  if (!uri && fallback) {
    return fallback
  }

  // Show a loader while the URI is populating
  if (!uri) {
    if (style?.loadingContainer) {
      return (
        <FlexCompat style={style.loadingContainer} testID={testID ? `loading-${testID}` : undefined}>
          <ImageLoadingFallback />
        </FlexCompat>
      )
    }
    return <ImageLoadingFallback />
  }

  // Get the sanitized url
  const imageHttpUrl = uriToHttpUrls(uri, { allowLocalUri })[0]

  // Log an error and show a fallback (or null) when the URI is bad
  if (!imageHttpUrl) {
    logger.warn('UniversalImage', 'UniversalImage', 'Could not retrieve and format remote image for uri', {
      data: uri,
    })

    // Return fallback or null
    return fallback ?? null
  }

  // Handle any svg separate from plain images
  if (isSVGUri(imageHttpUrl)) {
    // verticalAlign is deliberately NOT forwarded: the legacy frame accepted the prop but never
    // emitted CSS for it, so forwarding it here would be a new web behavior, not parity.
    // TODO(INFRA-3682): forward verticalAlign (or drop it from UniversalImageStyle) once the
    // migration lands and a behavioral change can be verified on its own.
    const svgContainerStyle: ViewStyle = {
      alignItems: 'center',
      backgroundColor: style?.image?.backgroundColor,
      borderRadius: style?.image?.borderRadius,
      height: style?.image?.height ?? size.height,
      overflow: 'hidden',
      width: style?.image?.width ?? size.width,
    }
    return (
      <FlexCompat style={svgContainerStyle} testID={testID ? `svg-${testID}` : undefined}>
        <SvgImage
          alt={alt}
          autoplay={autoplay}
          fallback={fallback}
          resizeMode={size.resizeMode}
          size={size}
          style={style?.image}
          uri={imageHttpUrl}
          onError={onError}
        />
      </FlexCompat>
    )
  }

  // Handle a plain image
  return (
    <PlainImage
      alt={alt}
      autoplay={autoplay}
      fallback={fallback}
      priority={priority}
      resizeMode={size.resizeMode}
      size={size}
      style={style?.image}
      testID={testID ? `img-${testID}` : undefined}
      transitionMs={transitionMs}
      uri={imageHttpUrl}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
