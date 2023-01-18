import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { ImageUri } from 'src/components/images/ImageUri'
import { WebSvgUri } from 'src/components/images/WebSvgUri'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  autoplay?: boolean
  squareGridView?: boolean
  maxHeight?: number
  placeholderContent?: string
  uri: string | undefined
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({
  autoplay = false,
  squareGridView = false,
  maxHeight,
  uri,
  placeholderContent,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const imageHttpUri = useMemo(() => (uri ? uriToHttp(uri)[0] : undefined), [uri])

  const fallback = useMemo(
    () => (
      <Box
        alignItems="center"
        aspectRatio={1}
        bg="background3"
        justifyContent="center"
        maxHeight={maxHeight ?? '100%'}
        width="100%">
        <Text color="textSecondary" variant="subheadSmall">
          {placeholderContent || t('Content not available')}
        </Text>
      </Box>
    ),
    [placeholderContent, maxHeight, t]
  )

  if (!imageHttpUri) {
    // Sometimes Opensea does not return any asset, show placeholder
    return fallback
  }

  if (imageHttpUri?.endsWith('.svg')) {
    return squareGridView ? (
      <WebSvgUri autoplay={autoplay} uri={imageHttpUri} />
    ) : (
      <WebSvgUri autoplay={autoplay} maxHeight={maxHeight} uri={imageHttpUri} />
    )
  }

  // TODO(MOB-954):  handle more asset types (video, audio, etc.)

  return squareGridView ? (
    <ImageUri
      fallback={fallback}
      imageStyle={style.squareImageStyle}
      resizeMode="cover"
      uri={imageHttpUri}
    />
  ) : (
    <ImageUri fallback={fallback} maxHeight={maxHeight} uri={imageHttpUri} />
  )
}

const style = StyleSheet.create({
  squareImageStyle: {
    height: '100%',
    width: '100%',
  },
})
