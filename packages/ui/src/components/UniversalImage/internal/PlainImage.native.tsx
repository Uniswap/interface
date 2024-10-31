import { useState } from 'react'
import { Image } from 'react-native'
import { PlainImageProps } from 'ui/src/components/UniversalImage/types'

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
