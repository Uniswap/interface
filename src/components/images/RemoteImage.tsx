import React from 'react'
import { Image } from 'react-native'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { resizeModeContain } from 'src/styles/image'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  borderRadius: number
  imageUrl: string
  height: number
  width: number
}

export function RemoteImage({ borderRadius, imageUrl, height, width }: Props) {
  const imageHttpUrl = uriToHttp(imageUrl)[0]
  if (!imageHttpUrl) return null

  // TODO: Add webview SVG support
  if (imageHttpUrl.includes('.svg')) {
    return (
      <Box bg="black" p="sm">
        <Text variant="bodySm">SVGs coming soon...</Text>
      </Box>
    )
  }

  return (
    <Image
      source={{ uri: imageHttpUrl }}
      style={{
        borderRadius: borderRadius,
        height: height,
        resizeMode: resizeModeContain,
        width: width,
      }}
    />
  )
}
