import React, { useEffect, useState } from 'react'
import { Image, ImageResizeMode, ImageStyle, StyleSheet } from 'react-native'
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
  resizeMode?: ImageResizeMode
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
    <Image
      resizeMode={resizeMode ?? 'contain'}
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
    />
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    height: undefined,
    width: '100%',
  },
})
