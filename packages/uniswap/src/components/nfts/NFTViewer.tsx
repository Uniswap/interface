import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniversalImage, type UniversalImageStyleDimensionValue } from 'ui/src'
import { UniversalImageResizeMode } from 'ui/src/components/UniversalImage/types'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isGifUri, isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'
import { createSemaphore, useSemaphoreGatedValue } from 'utilities/src/react/useSemaphoreGatedValue'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// Caps NFT image fetches that can be in flight at once. Images fetch in
// parallel as cells mount, so a fast scroll may create lots of memory strain
const NFT_IMAGE_LOAD_SEMAPHORE = createSemaphore(24)
// Timeout for cells whose `onLoad` never fires
const NFT_IMAGE_LOAD_TIMEOUT_MS = 10 * ONE_SECOND_MS

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
  // Note: `thumbnailUrl` is whatever the indexer returns and is not size-bounded. For
  // non-OpenSea-indexed collections it is often the original asset (multi-MB PNG/JPEG).
  // expo-image's `allowDownscaling` shrinks the decoded bitmap, but the source still has
  // to be fetched and partially decoded — this is a known OOM risk on grids with many
  // cells visible at once. A future fix should constrain via a CDN size param or proxy.
  const imageHttpUri = svgRenderingDisabled && thumbnailUrl ? thumbnailUrl : uri ? uriToHttpUrls(uri)[0] : undefined

  const isSvg = imageHttpUri ? isSVGUri(imageHttpUri) : false
  const showFallback = !imageHttpUri || (isSvg && Boolean(svgRenderingDisabled))

  const isGif = imageHttpUri ? isGifUri(imageHttpUri) : false
  const formattedUri =
    !showFallback && imageHttpUri
      ? isGif && limitGIFSize
        ? convertGIFUriToSmallImageFormat(imageHttpUri, limitGIFSize)
        : imageHttpUri
      : undefined

  // Cap concurrent NFT image fetches so a fast scroll across the grid can't overwhelm
  // memory with parallel decodes.
  const { gatedValue: gatedUri, release: releaseGate } = useSemaphoreGatedValue({
    value: formattedUri,
    semaphore: NFT_IMAGE_LOAD_SEMAPHORE,
    timeoutMs: NFT_IMAGE_LOAD_TIMEOUT_MS,
  })

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

  if (showFallback) {
    // Either no asset or an SVG that this surface refuses to render.
    return fallback
  }

  if (!gatedUri) {
    // Waiting on a concurrency slot. Render a transparent fill so the parent's
    // skeleton background shows through; visible only during fast-scroll bursts.
    return <Flex fill aspectRatio={1} maxHeight={maxHeight ?? '100%'} width="100%" />
  }

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
      skipSizeCalculation
      // Skip the cross-fade so we don't hold both old + new bitmaps in memory during
      // FlashList recycling on the NFT grid.
      transitionMs={0}
      // Deprioritize NFT thumbnails in the native loading queue so token logos / avatars
      // can preempt them.
      priority="low"
      uri={gatedUri}
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
      onLoad={releaseGate}
      onError={releaseGate}
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
