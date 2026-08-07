import { isTestEnv } from '@universe/environment'
import { Flex } from 'ui/src/components/layout/Flex'
import { useImageLoadError } from 'ui/src/components/UniversalImage/hooks/useImageLoadError'
import { type PlainImageProps, UniversalImageResizeMode } from 'ui/src/components/UniversalImage/types'

export function PlainImage({
  uri,
  size,
  fallback,
  resizeMode,
  style,
  testID,
  onLoad,
  onError,
}: PlainImageProps): JSX.Element {
  const { hasError, markErrored } = useImageLoadError(uri)

  if (hasError && fallback) {
    return fallback
  }

  // TODO cover all cases better
  const objectFit =
    resizeMode === UniversalImageResizeMode.Contain || resizeMode === UniversalImageResizeMode.Cover
      ? resizeMode
      : 'contain'

  const imgElement = (
    <img
      // remount on uri change: a queued error event for the old src can fire after the new src
      // commits to the same element, which would mark the new uri as errored
      key={uri}
      height={size.height}
      src={uri}
      // width/height also set as inline CSS: global stylesheet rules (img { height: auto }) override
      // the HTML size attributes, which let non-square images escape their intended box
      style={{ objectFit, aspectRatio: size.aspectRatio, width: size.width, height: size.height, ...style }}
      width={size.width}
      onError={() => {
        markErrored()
        onError?.()
      }}
      onLoad={onLoad}
    />
  )

  // TODO(MOB-3485): remove test run special casing
  if (isTestEnv()) {
    return <Flex testID={testID}>{imgElement}</Flex>
  } else {
    return imgElement
  }
}
