import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniversalImage, type UniversalImageStyleDimensionValue } from 'ui/src'
import { UniversalImageResizeMode } from 'ui/src/components/UniversalImage/types'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isGifUri, isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'

type Props = {
  uri: string | undefined
  autoplay?: boolean
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

  const isSvg = isSVGUri(imageHttpUri)

  if (isSvg && props.svgRenderingDisabled) {
    return fallback
  }

  const isGif = isGifUri(imageHttpUri)
  const formattedUri =
    isGif && limitGIFSize ? convertGIFUriToSmallImageFormat(imageHttpUri, limitGIFSize) : imageHttpUri

  const aspectRatio = imageDimensions ? imageDimensions.width / imageDimensions.height : 1

  // Although the image dimensions are sometimes provided, everywhere the NftViewer is used,
  // we want the images to fill the container instead of rendering in their original dimensions.
  // That's why we set the width and height to 100% in the image style.
  const width: UniversalImageStyleDimensionValue = '100%'
  const height: UniversalImageStyleDimensionValue = '100%'
  const style = { image: { width, height, maxHeight: maxHeight ?? '100%' } }

  return (
    <UniversalImage
      allowUndefinedSize
      uri={formattedUri}
      size={{
        aspectRatio,
        height: imageDimensions?.height ?? maxHeight,
        width: imageDimensions?.width,
        resizeMode: UniversalImageResizeMode.Contain,
      }}
      style={style}
      autoplay={autoplay}
      fallback={fallback}
      shouldRasterizeIOS={isGif && Boolean(limitGIFSize)}
    />
  )
}

const OPENSEA_IMAGE_SIZE_QUERY_PARAM = 'w=500'

function convertGIFUriToSmallImageFormat(uri: string, limitGIFSize: number): string {
  if (uri.includes(OPENSEA_IMAGE_SIZE_QUERY_PARAM)) {
    return uri.replace(OPENSEA_IMAGE_SIZE_QUERY_PARAM, `w=${limitGIFSize}`)
  }
  return uri
}
