import React from 'react'
import { Image, ImageResizeMode } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { logger } from 'src/utils/logger'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  backgroundColor?: string
  borderRadius: number
  uri: string
  height: number
  width: number
}

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

export function RemoteImage({ backgroundColor, borderRadius, uri, height, width }: Props) {
  const imageHttpUrl = uriToHttp(uri)[0]

  if (!imageHttpUrl) {
    logger.error('RemoteImage', '', `Could not retrieve and format remote image for uri: ${uri}`)
    return null
  }

  if (imageHttpUrl.endsWith('.svg')) {
    return (
      <SvgUri
        height={height}
        style={{ backgroundColor, borderRadius }}
        uri={imageHttpUrl}
        width={width}
      />
    )
  }

  return (
    <Image
      source={{ uri: imageHttpUrl }}
      style={{
        backgroundColor,
        borderRadius,
        height,
        resizeMode: RESIZE_MODE_CONTAIN,
        width,
      }}
    />
  )
}
