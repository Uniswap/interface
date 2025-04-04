import { BigNumber } from '@ethersproject/bignumber'
import { formatEther as ethersFormatEther } from '@ethersproject/units'
import { TimedLoader } from 'nft/components/bag/TimedLoader'
import { Suspicious } from 'nft/components/card/icons'
import {
  ChevronDownBagIcon,
  ChevronUpBagIcon,
  CircularCloseIcon,
  CloseTimerIcon,
  SquareArrowDownIcon,
  SquareArrowUpIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { loadingBlock } from 'nft/css/loading.css'
import { GenieAsset, UpdatedGenieAsset } from 'nft/types'
import { getAssetHref } from 'nft/utils'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Flex, Image, Text, TouchableAreaEvent, View } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export const RemoveAssetButton = ({ onClick }: { onClick: (e: TouchableAreaEvent) => void }) => (
  <Flex
    position="absolute"
    right={-11}
    top={-11}
    zIndex="$default"
    width={45}
    height={45}
    alignItems="center"
    justifyContent="center"
    animation="125ms"
    onPress={onClick}
  >
    <CircularCloseIcon />
  </Flex>
)

const NoContentContainer = () => (
  <Flex position="relative" backgroundColor="$surface3" width="56" height="56" borderRadius="$rounded8">
    <Text
      position="absolute"
      textAlign="center"
      left="50%"
      top="50%"
      style={{ transform: 'translate3d(-50%, -50%, 0)' }}
      color="$neutral2"
      variant="body3"
    >
      Image
      <br />
      not
      <br />
      available
    </Text>
  </Flex>
)

interface BagRowProps {
  asset: UpdatedGenieAsset
  usdPrice?: number
  removeAsset: (assets: GenieAsset[]) => void
  showRemove?: boolean
  grayscale?: boolean
  isMobile: boolean
}

export const BagRow = ({ asset, usdPrice, removeAsset, showRemove, grayscale, isMobile }: BagRowProps) => {
  const { formatEther, formatNumberOrString } = useFormatter()
  const [loadedImage, setImageLoaded] = useState(false)
  const [noImageAvailable, setNoImageAvailable] = useState(!asset.smallImageUrl)

  const [cardHovered, setCardHovered] = useState(false)
  const handleMouseEnter = useCallback(() => setCardHovered(true), [])
  const handleMouseLeave = useCallback(() => setCardHovered(false), [])
  const showRemoveButton = Boolean(showRemove && cardHovered && !isMobile)

  const assetEthPrice = asset.updatedPriceInfo ? asset.updatedPriceInfo.ETHPrice : asset.priceInfo.ETHPrice
  const assetEthPriceFormatted = formatEther({ input: assetEthPrice, type: NumberType.NFTToken })
  const assetUSDPriceFormatted = formatNumberOrString({
    input: usdPrice ? parseFloat(ethersFormatEther(assetEthPrice)) * usdPrice : usdPrice,
    type: NumberType.FiatNFTToken,
  })

  const handleRemoveClick = useCallback(
    (e: TouchableAreaEvent) => {
      e.preventDefault()
      e.stopPropagation()
      removeAsset([asset])
    },
    [asset, removeAsset],
  )

  return (
    <Link to={getAssetHref(asset)} style={{ textDecoration: 'none' }}>
      <Flex
        row
        px="$padding12"
        py="$padding8"
        gap="$gap12"
        cursor="pointer"
        height="100%"
        borderRadius="$rounded12"
        ml={-4}
        mr={-4}
        width="100%"
        hoverStyle={{
          backgroundColor: '$deprecated_stateOverlayHover',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Flex>
          {showRemove && isMobile && <RemoveAssetButton onClick={handleRemoveClick} />}
          {!noImageAvailable && (
            <Image
              src={asset.smallImageUrl}
              alt={asset.name}
              height={56}
              width={56}
              borderRadius="$rounded8"
              objectFit="cover"
              onLoad={() => {
                setImageLoaded(true)
              }}
              onError={() => {
                setNoImageAvailable(true)
              }}
              $platform-web={{
                visibility: loadedImage ? 'visible' : 'hidden',
                filter: grayscale && !cardHovered ? 'grayscale(100%)' : 'none',
              }}
            />
          )}
          {!loadedImage && (
            <View position="absolute" className={`${loadingBlock}`} width="56" height="56" borderRadius="$rounded8" />
          )}
          {noImageAvailable && <NoContentContainer />}
        </Flex>
        <Flex overflow="hidden" flex={1}>
          <Flex row overflow="hidden" width="full" $platform-web={{ whiteSpace: 'nowrap' }}>
            <Text
              color={grayscale ? '$neutral2' : '$neutral1'}
              variant="body3"
              textOverflow="ellipsis"
              maxWidth="80%"
              textWrap="nowrap"
            >
              {asset.name ?? `#${asset.tokenId}`}
            </Text>
            {asset.susFlag && <Suspicious />}
          </Flex>
          <Flex row overflow="hidden" $platform-web={{ whiteSpace: 'nowrap' }} gap="$spacing2">
            <Text
              color={grayscale ? '$neutral2' : '$neutral1'}
              variant="body3"
              textOverflow="ellipsis"
              maxWidth="80%"
              textWrap="nowrap"
            >
              {asset.collectionName}
            </Text>
            {asset.collectionIsVerified && <VerifiedIcon style={{ flexShrink: 0 }} />}
          </Flex>
        </Flex>
        {showRemoveButton && (
          <Button
            zIndex={zIndexes.mask}
            size="small"
            onPress={handleRemoveClick}
            position="absolute"
            right="$spacing12"
            top="$spacing8"
          >
            Remove
          </Button>
        )}
        {!isMobile && (
          <Flex flexShrink={0} alignItems="flex-end" opacity={showRemoveButton ? 0 : 1}>
            <Text variant="body3">
              {assetEthPriceFormatted}
              &nbsp;ETH
            </Text>
            <Text variant="body4" color="$neutral2">
              {assetUSDPriceFormatted}
            </Text>
          </Flex>
        )}
      </Flex>
    </Link>
  )
}

interface PriceChangeBagRowProps {
  asset: UpdatedGenieAsset
  usdPrice?: number
  markAssetAsReviewed: (asset: UpdatedGenieAsset, toKeep: boolean) => void
  top?: boolean
  isMobile: boolean
}

export const PriceChangeBagRow = ({ asset, usdPrice, markAssetAsReviewed, top, isMobile }: PriceChangeBagRowProps) => {
  const { formatEther } = useFormatter()
  const isPriceIncrease = BigNumber.from(asset.updatedPriceInfo?.ETHPrice).gt(BigNumber.from(asset.priceInfo.ETHPrice))
  const handleRemove = useCallback(
    (e: TouchableAreaEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const toKeep = false
      markAssetAsReviewed(asset, toKeep)
    },
    [asset, markAssetAsReviewed],
  )
  const handleKeep = useCallback(
    (e: TouchableAreaEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const toKeep = true
      markAssetAsReviewed(asset, toKeep)
    },
    [asset, markAssetAsReviewed],
  )
  return (
    <Flex
      gap="$gap8"
      py="$spacing16"
      mx="$spacing8"
      borderBottomColor="$surface3"
      height="100%"
      cursor="pointer"
      borderTopColor={top ? '$surface3' : '$transparent'}
    >
      <Flex row gap="$spacing4">
        {isPriceIncrease ? <SquareArrowUpIcon /> : <SquareArrowDownIcon />}
        <Text variant="body3" color="gold">{`Price ${isPriceIncrease ? 'increased' : 'decreased'} from ${formatEther({
          input: asset.priceInfo.ETHPrice,
          type: NumberType.NFTToken,
        })} ETH`}</Text>
      </Flex>
      <Flex>
        <BagRow asset={asset} usdPrice={usdPrice} removeAsset={() => undefined} isMobile={isMobile} />
      </Flex>
      <Flex row gap="$spacing8" justifyContent="space-between">
        <Button
          flex={1}
          borderRadius="$rounded12"
          width="50%"
          emphasis="secondary"
          size="xsmall"
          onPress={handleRemove}
        >
          <Text variant="buttonLabel3">Remove</Text>
        </Button>
        <Button
          flex={1}
          borderRadius="$rounded12"
          width="50%"
          emphasis="primary"
          variant="branded"
          size="xsmall"
          onPress={handleKeep}
        >
          <Text variant="buttonLabel3">Keep</Text>
        </Button>
      </Flex>
    </Flex>
  )
}

interface UnavailableAssetsHeaderRowProps {
  assets?: UpdatedGenieAsset[]
  usdPrice?: number
  clearUnavailableAssets: () => void
  didOpenUnavailableAssets: boolean
  setDidOpenUnavailableAssets: (didOpen: boolean) => void
  isMobile: boolean
}

interface UnavailableAssetsPreviewProps {
  assets: UpdatedGenieAsset[]
}

const ASSET_PREVIEW_WIDTH = 32
const ASSET_PREVIEW_OFFSET = 20

const UnavailableAssetsPreview = ({ assets }: UnavailableAssetsPreviewProps) => (
  <View
    $platform-web={{
      display: 'grid',
    }}
    style={{
      gridTemplateColumns: `repeat(${assets.length}, 20px)`,
      width: `${ASSET_PREVIEW_WIDTH + (assets.length - 1) * ASSET_PREVIEW_OFFSET}px`,
    }}
  >
    {assets.map((asset, index) => (
      <Image
        key={`${asset.address}-${asset.tokenId}`}
        src={asset.smallImageUrl}
        width={32}
        height={32}
        borderWidth={1}
        borderColor="$surface1"
        borderRadius="$rounded4"
        zIndex={index}
        $platform-web={{
          filter: 'grayscale(100%)',
        }}
      />
    ))}
  </View>
)

export const UnavailableAssetsHeaderRow = ({
  assets,
  usdPrice,
  clearUnavailableAssets,
  didOpenUnavailableAssets,
  setDidOpenUnavailableAssets,
  isMobile,
}: UnavailableAssetsHeaderRowProps) => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const timerLimit = 8
  const [timeLeft, setTimeLeft] = useState(timerLimit)

  useEffect(() => {
    if (!timeLeft) {
      if (!didOpenUnavailableAssets) {
        clearUnavailableAssets()
        setDidOpenUnavailableAssets(false)
      }
      return undefined
    }

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [timeLeft, clearUnavailableAssets, didOpenUnavailableAssets, setDidOpenUnavailableAssets])

  if (!assets || assets.length === 0) {
    return null
  }

  const moreThanOneUnavailable = assets.length > 1
  const isShowingAssets = isOpen || !moreThanOneUnavailable

  return (
    <Flex
      gap="$gap12"
      mx="$spacing8"
      py="$spacing16"
      borderWidth={1}
      borderColor="$transparent"
      borderTopColor="$surface3"
      borderBottomColor="$surface3"
      height="100%"
    >
      <Flex>
        <Flex
          row
          justifyContent="space-between"
          mb={isShowingAssets ? '$spacing12' : 0}
          cursor={moreThanOneUnavailable ? 'pointer' : 'default'}
          onPress={() => {
            if (moreThanOneUnavailable) {
              !didOpenUnavailableAssets && setDidOpenUnavailableAssets(true)
              toggleOpen()
            }
          }}
        >
          <Text gap="$gap12" color="$neutral2" variant="body3">
            {!isShowingAssets && <UnavailableAssetsPreview assets={assets.slice(0, 5)} />}
            No longer available
          </Text>
          {moreThanOneUnavailable && (
            <Flex row>
              {isOpen ? <ChevronUpBagIcon color="$neutral2" /> : <ChevronDownBagIcon color="$neutral2" />}
            </Flex>
          )}
          {!didOpenUnavailableAssets && (
            <Flex
              row
              width="$spacing20"
              height="$spacing20"
              justifyContent="center"
              cursor="pointer"
              onPress={clearUnavailableAssets}
            >
              <TimedLoader />
              <CloseTimerIcon color="$neutral1" />
            </Flex>
          )}
        </Flex>
        <Flex gap="$gap8" ml={-8} mr={-8}>
          {isShowingAssets &&
            assets.map((asset) => (
              <BagRow
                key={asset.id}
                asset={asset}
                usdPrice={usdPrice}
                removeAsset={() => undefined}
                grayscale
                isMobile={isMobile}
              />
            ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
