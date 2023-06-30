import React from 'react'
import { Image, ImageResizeMode } from 'react-native'
import { RemoteSvg } from 'src/components/images/RemoteSvg'
import { logger } from 'wallet/src/features/logger/logger'
import { uriToHttp } from 'wallet/src/utils/uriToHttp'

type Props = {
  backgroundColor?: string
  borderRadius: number
  uri: string
  height: number
  width: number
  fallback?: JSX.Element
}

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

export function RemoteImage({
  backgroundColor,
  borderRadius,
  uri,
  height,
  width,
  fallback,
}: Props): JSX.Element | null {
  const imageHttpUrl = uriToHttp(uri)[0]

  if (!imageHttpUrl) {
    logger.warn('RemoteImage', '', `Could not retrieve and format remote image for uri: ${uri}`)
    return fallback ?? null
  }

  if (imageHttpUrl.includes('.svg')) {
    return (
      <RemoteSvg
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        height={height}
        imageHttpUrl={imageHttpUrl}
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
