import { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import FastImage from 'react-native-fast-image'
import { Box } from 'ui/src'
import { Loader } from 'ui/src/loading'
import { ImageUriProps } from 'wallet/src/features/images/ImageUri'

export function ImageUri({
  maxHeight,
  uri,
  fallback,
  imageStyle,
  resizeMode,
  loadingContainerStyle,
  imageDimensions,
  ...rest
}: ImageUriProps): JSX.Element | null {
  const [height, setHeight] = useState<number | null>(imageDimensions?.height ?? null)
  const [width, setWidth] = useState<number | null>(imageDimensions?.width ?? null)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // If we know dimension, skip this effect
    if (!uri || Boolean(imageDimensions)) return
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
        <Box style={loadingContainerStyle}>
          <Loader.Image />
        </Box>
      )
    }
    return <Loader.Image />
  }

  return (
    <FastImage
      resizeMode={resizeMode ?? FastImage.resizeMode.contain}
      source={{ uri }}
      style={
        imageStyle ?? [
          {
            aspectRatio: width / height,
            maxHeight: maxHeight ?? '100%',
          },
          styles.fullWidth,
        ]
      }
      onError={(): void => setIsError(true)}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    height: undefined,
    width: '100%',
  },
})
