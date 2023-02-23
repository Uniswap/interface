import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import FastImage, { FastImageProps, ImageStyle, ResizeMode } from 'react-native-fast-image'
import { Box, BoxProps } from 'src/components/layout'
import { Loader } from 'src/components/loading'

export function ImageUri({
  maxHeight,
  uri,
  fallback,
  imageStyle,
  resizeMode,
  loadingContainerStyle,
  imageDimensions,
  ...rest
}: {
  maxHeight?: number
  uri?: string
  fallback?: JSX.Element
  imageStyle?: ImageStyle
  resizeMode?: ResizeMode
  loadingContainerStyle?: BoxProps['style']
  /**
   * Can optimize performance by prefetching dimensions in api request on Image field,
   * which allows us to avoid setting state in this component
   */
  imageDimensions?: { width: number; height: number } | undefined
} & Pick<FastImageProps, 'shouldRasterizeIOS'>): JSX.Element | null {
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
