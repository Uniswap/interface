import React from 'react'
import { Image } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { resizeModeContain } from 'src/styles/image'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  borderRadius: number
  uri: string
  height: number
  width: number
}

export function RemoteImage({ borderRadius, uri, height, width }: Props) {
  const imageHttpUrl = uriToHttp(uri)[0]

  if (imageHttpUrl.endsWith('.svg')) {
    return <SvgUri style={{ borderRadius, width, height }} uri={imageHttpUrl} />
  }

  return (
    <Image
      source={{ uri: imageHttpUrl }}
      style={{
        borderRadius,
        height,
        resizeMode: resizeModeContain,
        width,
      }}
    />
  )
}
