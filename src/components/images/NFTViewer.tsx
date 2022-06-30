import React from 'react'
import { ImageUri } from 'src/components/images/ImageUri'
import { WebSvgUri } from 'src/components/images/WebSvgUri'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  borderRadius?: number
  uri: string
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({ uri, ...rest }: Props) {
  const imageHttpUri = uriToHttp(uri)[0]

  if (imageHttpUri?.endsWith('.svg')) {
    return <WebSvgUri uri={imageHttpUri} />
  } else {
    return <ImageUri uri={imageHttpUri} {...rest} />
  }
}
