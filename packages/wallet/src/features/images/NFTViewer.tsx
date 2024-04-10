import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Flex, Text } from 'ui/src'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { NFTPreviewImage } from 'wallet/src/features/images/NFTPreviewImage'
import { WebSvgUri } from 'wallet/src/features/images/WebSvgUri'
import { ImageUri, ImageUriProps } from './ImageUri'

type PreviewProps =
  // Don't show preview if showSvgPreview is not provided or is false
  | {
      showSvgPreview?: false
    }
  // Show preview if showSvgPreview is true and contractAddress and tokenId
  // are provided (can be undefined if the backend does not return them in
  // the response - the fallback will be shown in this case)
  | {
      showSvgPreview: true
      contractAddress: string | undefined
      tokenId: string | undefined
    }

type Props = {
  uri: string | undefined
  autoplay?: boolean
  squareGridView?: boolean
  maxHeight?: number
  limitGIFSize?: number // for certain Opensea assets, reduce the GIF size to boost animation grid layout performance
  placeholderContent?: string
  imageDimensions?: { width: number; height: number } | undefined
} & PreviewProps

/**
 * Renders a remote NFT image or SVG and automatically expands to fill parent container
 */
export function NFTViewer(props: Props): JSX.Element {
  const {
    uri,
    autoplay = false,
    squareGridView = false,
    maxHeight,
    limitGIFSize,
    placeholderContent,
    imageDimensions,
  } = props
  const { t } = useTranslation()
  const imageHttpUri = uri ? uriToHttp(uri)[0] : undefined

  const fallback = useMemo(
    () => (
      <Flex
        centered
        aspectRatio={1}
        backgroundColor="$surface2"
        maxHeight={maxHeight ?? '100%'}
        width="100%">
        <Text color="$neutral2" flex={0} variant="subheading2">
          {placeholderContent || t('tokens.nfts.error.unavailable')}
        </Text>
      </Flex>
    ),
    [placeholderContent, maxHeight, t]
  )

  if (!imageHttpUri) {
    // Sometimes Opensea does not return any asset, show placeholder
    return fallback
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
    imageProps.resizeMode = 'contain'
  } else if (imageDimensions) {
    imageProps.loadingContainerStyle = {
      aspectRatio: imageDimensions.width / imageDimensions.height,
    }
  }

  const isSvg = isSVGUri(imageHttpUri)

  if (!isSvg) {
    return <ImageUri {...imageProps} />
  }

  if (!props.showSvgPreview) {
    return (
      <WebSvgUri
        autoplay={autoplay}
        maxHeight={squareGridView ? undefined : maxHeight}
        uri={imageHttpUri}
      />
    )
  }

  // Display fallback if preview data is not provided
  if (!props.contractAddress || !props.tokenId) {
    return fallback
  }

  return (
    <NFTPreviewImage
      contractAddress={props.contractAddress}
      imageProps={imageProps}
      tokenId={props.tokenId}
    />
  )
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
