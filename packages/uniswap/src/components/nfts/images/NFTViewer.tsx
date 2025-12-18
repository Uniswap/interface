import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ImageUri, ImageUriProps } from 'uniswap/src/components/nfts/images/ImageUri'
import { WebSvgUri } from 'uniswap/src/components/nfts/images/WebSvgUri'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isGifUri, isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'

type Props = {
  uri: string | undefined
  autoplay?: boolean
  squareGridView?: boolean
  maxHeight?: number
  limitGIFSize?: number // for certain Opensea assets, reduce the GIF size to boost animation grid layout performance
  placeholderContent?: string
  imageDimensions?: { width: number; height: number } | undefined
  svgRenderingDisabled?: boolean // Used for screens that should use PNG thumbnails instead of SVGs for perf
  thumbnailUrl?: string | undefined
}

export function NFTViewer(props: Props): JSX.Element {
  const {
    uri,
    thumbnailUrl,
    autoplay = false,
    squareGridView = false,
    maxHeight,
    limitGIFSize,
    placeholderContent,
    imageDimensions,
    svgRenderingDisabled,
  } = props
  const { t } = useTranslation()

  // if svgRenderingDisabled is true, use thumbnailUrl which is a PNG, otherwise use uri
  const imageHttpUri = svgRenderingDisabled && thumbnailUrl ? thumbnailUrl : uri ? uriToHttpUrls(uri)[0] : undefined

  const fallback = useMemo(() => {
    const isPlaceholderAddress = isEVMAddress(placeholderContent)
    return (
      <Flex
        centered
        fill
        aspectRatio={1}
        backgroundColor="$surface2"
        maxHeight={maxHeight ?? '100%'}
        width="100%"
        p="$spacing8"
      >
        <Text color="$neutral2" textAlign="center" variant="subheading2">
          {isPlaceholderAddress
            ? shortenAddress({ address: placeholderContent })
            : placeholderContent || t('tokens.nfts.error.unavailable')}
        </Text>
      </Flex>
    )
  }, [placeholderContent, maxHeight, t])

  if (!imageHttpUri) {
    // Sometimes Opensea does not return any asset, show placeholder
    return fallback
  }

  const isGif = isGifUri(imageHttpUri)
  const formattedUri =
    isGif && limitGIFSize ? convertGIFUriToSmallImageFormat(imageHttpUri, limitGIFSize) : imageHttpUri

  const imageProps: ImageUriProps = {
    fallback,
    imageDimensions,
    maxHeight,
    shouldRasterizeIOS: isGif && Boolean(limitGIFSize),
    uri: formattedUri,
  }

  if (squareGridView) {
    imageProps.imageStyle = {
      height: '100%',
      width: '100%',
    }
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

  if (props.svgRenderingDisabled) {
    return fallback
  }

  return <WebSvgUri autoplay={autoplay} maxHeight={squareGridView ? undefined : maxHeight} uri={imageHttpUri} />
}

const OPENSEA_IMAGE_SIZE_QUERY_PARAM = 'w=500'

function convertGIFUriToSmallImageFormat(uri: string, limitGIFSize: number): string {
  if (uri.includes(OPENSEA_IMAGE_SIZE_QUERY_PARAM)) {
    return uri.replace(OPENSEA_IMAGE_SIZE_QUERY_PARAM, `w=${limitGIFSize}`)
  }
  return uri
}
