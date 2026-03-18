import { useState } from 'react'
import { Image } from 'react-native'
import { type PlainImageProps } from 'ui/src/components/UniversalImage/types'

export function PlainImage({ uri, size, fallback, resizeMode, style, testID, onLoad }: PlainImageProps): JSX.Element {
  const [hasError, setHasError] = useState(false)

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
      }}
      onLoad={onLoad}
    />
  )
}
