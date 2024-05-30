import { useEffect, useState } from 'react'
import { Image } from 'react-native'
import { Flex, Loader } from 'ui/src'
import { ImageUriProps } from 'wallet/src/features/images/ImageUri'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'

export function ImageUri({
  uri,
  fallback,
  loadingContainerStyle,
  imageDimensions,
}: ImageUriProps): JSX.Element | null {
  const [height, setHeight] = useState<number | null>(imageDimensions?.height ?? null)
  const [width, setWidth] = useState<number | null>(imageDimensions?.width ?? null)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // If we know dimension, skip this effect
    if (!uri || Boolean(imageDimensions)) {
      return
    }
    Image.getSize(
      uri,
      (calculatedWidth: number, calculatedHeight: number) => {
        setWidth(calculatedWidth)
        setHeight(calculatedHeight)
        setIsError(!calculatedHeight || !calculatedWidth)
      },
      () => {
        setIsError(true)
      }
    )
  }, [imageDimensions, uri])

  if (isError) {
    return fallback ?? null
  }

  if (!width || !height || !uri) {
    if (loadingContainerStyle) {
      return (
        <Flex style={loadingContainerStyle}>
          <Loader.Image />
        </Flex>
      )
    }
    return <Loader.Image />
  }

  // TODO: get sizing and other params accounted for
  return (
    <RemoteImage
      aspectRatio={width / height}
      borderRadius={0}
      height={height}
      uri={uri}
      width={width}
    />
  )
}
