/* oxlint-disable complexity */
import { useEffect, useState } from 'react'
import { type ColorTokens, Image } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { PlainImage } from 'ui/src/components/UniversalImage/internal/PlainImage'
import { SvgImage } from 'ui/src/components/UniversalImage/internal/SvgImage'
import { type UniversalImageProps, type UniversalImageSize } from 'ui/src/components/UniversalImage/types'
import { Loader } from 'ui/src/loading/Loader'
import { isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'

const LOADING_FALLBACK = <Loader.Image />

export function UniversalImage({
  uri,
  size,
  style,
  fallback,
  testID,
  onLoad,
  onError,
  allowLocalUri = false,
  autoplay = true,
  allowUndefinedSize = false,
  skipSizeCalculation = false,
  transitionMs,
  priority,
}: UniversalImageProps): JSX.Element | null {
  // Allow calculation of fields as needed
  const [width, setWidth] = useState(size.width)
  const [height, setHeight] = useState(size.height)
  const computedSize: UniversalImageSize = { width, height, aspectRatio: size.aspectRatio }

  const [errored, setErrored] = useState(false)

  const hasWidthAndHeight = computedSize.width !== undefined && computedSize.height !== undefined
  const hasHeightAndRatio = computedSize.height !== undefined && computedSize.aspectRatio !== undefined
  const sizeKnown = hasWidthAndHeight || hasHeightAndRatio

  const isRequireSource = typeof uri === 'number'

  // Propagate prop updates to state
  useEffect(() => {
    setWidth(size.width)
    setHeight(size.height)
  }, [size.height, size.width])

  // Calculate width/height and check for an error in the image retrieval
  // TODO(apps-infra): See if we can remove this when Expo Image is fully enabled
  useEffect(() => {
    // If we know dimension skip calculating width/height
    if (skipSizeCalculation || !uri || sizeKnown || isRequireSource) {
      return
    }

    // Calculate size if not enough info is given
    Image.getSize(
      uri,
      (calculatedWidth: number, calculatedHeight: number) => {
        setWidth(calculatedWidth)
        setHeight(calculatedHeight)
      },
      () => {
        setErrored(true)
        onError?.()
      },
    )
  }, [width, height, sizeKnown, uri, isRequireSource, skipSizeCalculation, onError])

  // Handle local URI
  if (isRequireSource) {
    return <Image height={size.height} source={uri} width={size.width} />
  }

  // Use the fallback if no URI at all
  if (!uri && fallback) {
    return fallback
  }

  // Show a loader while the URI is populating or size is calculating when there's no fallback
  // Skip this check if allowUndefinedSize is true (for cases where parent container handles sizing)
  if (!uri || (!sizeKnown && !errored && !allowUndefinedSize)) {
    if (style?.loadingContainer) {
      return <Flex style={style.loadingContainer}>{LOADING_FALLBACK}</Flex>
    }
    return LOADING_FALLBACK
  }

  // Get the sanitized url
  const imageHttpUrl = uriToHttpUrls(uri, { allowLocalUri })[0]

  // Log an error and show a fallback (or null) when the URI is bad or an error loading occurs
  if (!imageHttpUrl || errored) {
    const errMsg = errored
      ? 'could not compute sizing information for uri'
      : 'Could not retrieve and format remote image for uri'
    logger.warn('UniversalImage', 'UniversalImage', errMsg, { data: uri })

    // Return fallback or null
    return fallback ?? null
  }

  // Handle any svg separate from plain images
  if (isSVGUri(imageHttpUrl)) {
    return (
      <Flex
        alignItems="center"
        backgroundColor={style?.image?.backgroundColor as ColorTokens}
        borderRadius={style?.image?.borderRadius}
        verticalAlign={style?.image?.verticalAlign}
        height={style?.image?.height ?? size.height}
        overflow="hidden"
        testID={testID ? `svg-${testID}` : undefined}
        width={style?.image?.width ?? size.width}
      >
        <SvgImage
          autoplay={autoplay}
          fallback={fallback}
          resizeMode={size.resizeMode}
          size={size}
          style={style?.image}
          uri={imageHttpUrl}
          onError={onError}
        />
      </Flex>
    )
  }

  // Handle a plain image
  return (
    <PlainImage
      autoplay={autoplay}
      fallback={fallback}
      priority={priority}
      resizeMode={size.resizeMode}
      size={computedSize}
      style={style?.image}
      testID={testID ? `img-${testID}` : undefined}
      transitionMs={transitionMs}
      uri={imageHttpUrl}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
