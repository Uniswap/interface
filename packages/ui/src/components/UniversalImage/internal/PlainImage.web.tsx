import { useState } from 'react'
import { Flex } from 'ui/src/components/layout/Flex'
import { PlainImageProps, UniversalImageResizeMode } from 'ui/src/components/UniversalImage/types'
import { isTestEnv } from 'utilities/src/environment/env'

export function PlainImage({ uri, size, fallback, resizeMode, style, testID, onLoad }: PlainImageProps): JSX.Element {
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
      style={{ objectFit, aspectRatio: size.aspectRatio, ...style }}
      width={size.width}
      onError={() => {
        setHasError(true)
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
