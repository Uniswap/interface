import React from 'react'
import { ImageUri } from 'src/components/images/ImageUri'
import { WebSvgUri } from 'src/components/images/WebSvgUri'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  maxHeight?: number
  uri: string
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({ maxHeight, uri }: Props) {
  const imageHttpUri = uriToHttp(uri)[0]

  if (imageHttpUri?.endsWith('.svg')) {
    return <WebSvgUri maxHeight={maxHeight} uri={imageHttpUri} />
  } else {
    return <ImageUri maxHeight={maxHeight} uri={imageHttpUri} />
  }
}
