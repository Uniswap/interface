import { isTestEnv } from '@universe/environment'
import { useState } from 'react'
import { Flex } from 'ui/src/components/layout/Flex'
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
  const [hasError, setHasError] = useState(false)

  // TODO cover all cases better
  const objectFit =
    resizeMode === UniversalImageResizeMode.Contain || resizeMode === UniversalImageResizeMode.Cover
      ? resizeMode
      : 'contain'

  const imgElement = (
    <img
      height={size.height}
      src={uri}
      // width/height also set as inline CSS: global stylesheet rules (img { height: auto }) override
      // the HTML size attributes, which let non-square images escape their intended box
      style={{ objectFit, aspectRatio: size.aspectRatio, width: size.width, height: size.height, ...style }}
      width={size.width}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
      onLoad={onLoad}
    />
  )

  if (hasError && fallback) {
    return fallback
  }

  // TODO(MOB-3485): remove test run special casing
  if (isTestEnv()) {
    return <Flex testID={testID}>{imgElement}</Flex>
  } else {
    return imgElement
  }
}
