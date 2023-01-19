import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import FastImage, { ImageStyle, ResizeMode } from 'react-native-fast-image'
import { Loader } from 'src/components/loading'

export function ImageUri({
  maxHeight,
  uri,
  fallback,
  imageStyle,
  resizeMode,
}: {
  maxHeight?: number
  uri?: string
  fallback?: JSX.Element
  imageStyle?: ImageStyle
  resizeMode?: ResizeMode
}): JSX.Element | null {
  const [height, setHeight] = useState<number | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!uri) return

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
  }, [uri])

  if (isError) {
    return fallback ?? null
  }

  if (!width || !height || !uri) {
    return <Loader.Image />
  }

  return (
    <FastImage
      resizeMode={resizeMode ?? FastImage.resizeMode.contain}
      source={{ uri, priority: FastImage.priority.high }} // Using priority high since it is referenced from scroll context where most recently scrolled image is highest priority
      style={
        imageStyle ?? [
          {
            aspectRatio: width / height,
            maxHeight: maxHeight ?? '100%',
          },
          styles.fullWidth,
        ]
      }
    />
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    height: undefined,
    width: '100%',
  },
})
