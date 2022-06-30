import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { Loading } from 'src/components/loading'

export function ImageUri({ uri }: { uri?: string }) {
  const [height, setHeight] = useState<number | null>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    if (!uri) return

    Image.getSize(uri, (calculatedWidth: number, calculatedHeight: number) => {
      setWidth(calculatedWidth)
      setHeight(calculatedHeight)
    })
  }, [uri])

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
