import React from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUri } from 'src/components/images/ImageUri'
import { WebSvgUri } from 'src/components/images/WebSvgUri'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  autoplay?: boolean
  borderRadius?: number
  maxHeight?: number
  placeholderContent?: string
  uri: string
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({ autoplay = false, maxHeight, uri, placeholderContent }: Props) {
  const { t } = useTranslation()
  const imageHttpUri = uriToHttp(uri)[0]

  if (!uri) {
    // Sometimes Opensea does not return any asset, show placeholder
    return (
      <Box
        alignItems="center"
        aspectRatio={1}
        bg="backgroundAction"
        justifyContent="center"
        width="100%">
        <Text color="textSecondary" variant="subheadSmall">
          {placeholderContent || t('Content not available')}
        </Text>
      </Box>
    )
  }

  if (imageHttpUri?.endsWith('.svg')) {
    return <WebSvgUri autoplay={autoplay} maxHeight={maxHeight} uri={imageHttpUri} />
  }

  // TODO:  handle more asset types (video, audio, etc.)

  return <ImageUri maxHeight={maxHeight} uri={imageHttpUri} />
}
