import React from 'react'
import { ImageUri } from 'src/components/images/ImageUri'
import { WebSvgUri } from 'src/components/images/WebSvgUri'
import { Box } from 'src/components/layout'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  autoplay?: boolean
  borderRadius?: number
  maxHeight?: number
  uri: string
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({ autoplay = false, maxHeight, uri }: Props) {
  const imageHttpUri = uriToHttp(uri)[0]

  if (!uri) {
    // Sometimes Opensea does not return any asset, show placeholder
    // TODO: replace with actual placeholder when design creates it
    return <Box aspectRatio={1} bg="backgroundAction" width="100%" />
  }

  if (imageHttpUri?.endsWith('.svg')) {
    return <WebSvgUri autoplay={autoplay} maxHeight={maxHeight} uri={imageHttpUri} />
  }

  // TODO:  handle more asset types (video, audio, etc.)

  return <ImageUri maxHeight={maxHeight} uri={imageHttpUri} />
}
