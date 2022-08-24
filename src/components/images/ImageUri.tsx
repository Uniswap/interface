import React, { ReactElement, useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { Loading } from 'src/components/loading'

export function ImageUri({
  maxHeight,
  uri,
  fallback,
}: {
  maxHeight?: number
  uri?: string
  fallback?: ReactElement
}) {
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
    return <Loading type="image" />
  }

  return (
    <Image
      resizeMode="contain"
      source={{ uri }}
      style={[
        {
          aspectRatio: width / height,
          maxHeight: maxHeight ?? '100%',
        },
        styles.fullWidth,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    height: undefined,
    width: '100%',
  },
})
