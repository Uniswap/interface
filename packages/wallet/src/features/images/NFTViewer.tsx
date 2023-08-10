import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Box } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text/Text'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { ImageUri, ImageUriProps } from './ImageUri'
import { WebSvgUri } from './WebSvgUri'

type Props = {
  uri: string | undefined
  autoplay?: boolean
  squareGridView?: boolean
  maxHeight?: number
  limitGIFSize?: number // for certain Opensea assets, reduce the GIF size to boost animation grid layout performance
  placeholderContent?: string
  imageDimensions?: { width: number; height: number } | undefined
}

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer({
  uri,
  autoplay = false,
  squareGridView = false,
  maxHeight,
  limitGIFSize,
  placeholderContent,
  imageDimensions,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const imageHttpUri = uri ? uriToHttp(uri)[0] : undefined

  const fallback = useMemo(
    () => (
      <Box
        alignItems="center"
        aspectRatio={1}
        bg="$DEP_background3"
        justifyContent="center"
        maxHeight={maxHeight ?? '100%'}
        width="100%">
        <Text color="$DEP_textSecondary" flex={0} variant="subheadSmall">
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

  if (isSVGUri(imageHttpUri)) {
    return squareGridView ? (
      <WebSvgUri autoplay={autoplay} uri={imageHttpUri} />
    ) : (
      <WebSvgUri autoplay={autoplay} maxHeight={maxHeight} uri={imageHttpUri} />
    )
  }

  /**
   * This is a hack to reduce the image size for certain gifs to improve performance (based on URL schema that most
   * animated NFTs on Opensea use).
   *
   * TODO: Ideally we need to find a way to get compressed images without having to change
   * source in data response.
   */
  const isGif = imageHttpUri.includes('.gif')

  const formattedUri =
    isGif && limitGIFSize
      ? convertGIFUriToSmallImageFormat(imageHttpUri, limitGIFSize)
      : imageHttpUri

  const imageProps: ImageUriProps = {
    fallback,
    imageDimensions,
    maxHeight,
    shouldRasterizeIOS: isGif && Boolean(limitGIFSize),
    uri: formattedUri,
  }

  if (squareGridView) {
    imageProps.imageStyle = style.squareImageStyle
    imageProps.resizeMode = 'cover'
  }

  return <ImageUri {...imageProps} />
}

const style = StyleSheet.create({
  squareImageStyle: {
    height: '100%',
    width: '100%',
  },
})

// Query parameter used to set size of requested Opensea image source, 500 is the default size on
// many animated Opensea asset source uris
const OPENSEA_IMAGE_SIZE_QUERY_PARAM = 'w=500'

function convertGIFUriToSmallImageFormat(uri: string, limitGIFSize: number): string {
  if (uri.includes(OPENSEA_IMAGE_SIZE_QUERY_PARAM)) {
    return uri.replace(OPENSEA_IMAGE_SIZE_QUERY_PARAM, `w=${limitGIFSize}`)
  }
  return uri
}
