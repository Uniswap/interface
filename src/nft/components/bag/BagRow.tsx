import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import clsx from 'clsx'
import { TimedLoader } from 'nft/components/bag/TimedLoader'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import {
  ChevronDownBagIcon,
  ChevronUpBagIcon,
  CircularCloseIcon,
  CloseTimerIcon,
  SquareArrowDownIcon,
  SquareArrowUpIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { bodySmall } from 'nft/css/common.css'
import { loadingBlock } from 'nft/css/loading.css'
import { GenieAsset, UpdatedGenieAsset } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal, getAssetHref } from 'nft/utils'
import { MouseEvent, useEffect, useReducer, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import * as styles from './BagRow.css'

const NoContentContainer = () => (
  <Box position="relative" background="loadingBackground" className={styles.bagRowImage}>
    <Box
      position="absolute"
      textAlign="center"
      left="1/2"
      top="1/2"
      style={{ transform: 'translate3d(-50%, -50%, 0)' }}
      color="grey500"
      fontSize="12"
      fontWeight="normal"
    >
      Image
      <br />
      not
      <br />
      available
    </Box>
  </Box>
)

interface BagRowProps {
  asset: UpdatedGenieAsset
  usdPrice: number | undefined
  removeAsset: (asset: GenieAsset) => void
  showRemove?: boolean
  grayscale?: boolean
  isMobile: boolean
}

export const BagRow = ({ asset, usdPrice, removeAsset, showRemove, grayscale, isMobile }: BagRowProps) => {
  const [cardHovered, setCardHovered] = useState(false)
  const [loadedImage, setImageLoaded] = useState(false)
  const [noImageAvailable, setNoImageAvailable] = useState(!asset.smallImageUrl)
  const handleCardHover = () => setCardHovered(!cardHovered)
  const assetCardRef = useRef<HTMLDivElement>(null)
  const showRemoveButton = showRemove && cardHovered

  if (cardHovered && assetCardRef.current && assetCardRef.current.matches(':hover') === false) setCardHovered(false)

  return (
    <Link to={getAssetHref(asset)} style={{ textDecoration: 'none' }}>
      <Row ref={assetCardRef} className={styles.bagRow} onMouseEnter={handleCardHover} onMouseLeave={handleCardHover}>
        <Box position="relative" display="flex">
          <Box
            display={showRemove && isMobile ? 'block' : 'none'}
            className={styles.removeAssetOverlay}
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              removeAsset(asset)
            }}
            transition="250"
            zIndex="1"
          >
            <CircularCloseIcon />
          </Box>
          {!noImageAvailable && (
            <Box
              as="img"
              src={asset.smallImageUrl}
              alt={asset.name}
              className={clsx(styles.bagRowImage, grayscale && !cardHovered && styles.grayscaleImage)}
              onLoad={() => {
                setImageLoaded(true)
              }}
              onError={() => {
                setNoImageAvailable(true)
              }}
              visibility={loadedImage ? 'visible' : 'hidden'}
            />
          )}
          {!loadedImage && <Box position="absolute" className={`${styles.bagRowImage} ${loadingBlock}`} />}
          {noImageAvailable && <NoContentContainer />}
        </Box>
        <Column overflow="hidden" width="full" color={grayscale ? 'textSecondary' : 'textPrimary'}>
          <Row overflow="hidden" width="full" justifyContent="space-between" whiteSpace="nowrap" gap="16">
            <Box className={styles.assetName}>{asset.name || asset.tokenId}</Box>
          </Row>
          <Row overflow="hidden" whiteSpace="nowrap" gap="2">
            <Box className={styles.collectionName}>{asset.collectionName}</Box>
            {asset.collectionIsVerified && <VerifiedIcon className={styles.icon} />}
          </Row>
        </Column>
        {showRemoveButton && !isMobile && (
          <Box
            marginLeft="16"
            className={styles.removeBagRowButton}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              removeAsset(asset)
            }}
          >
            Remove
          </Box>
        )}
        {(!showRemoveButton || isMobile) && (
          <Column flexShrink="0">
            <Box className={styles.bagRowPrice}>
              {`${formatWeiToDecimal(
                asset.updatedPriceInfo ? asset.updatedPriceInfo.ETHPrice : asset.priceInfo.ETHPrice
              )} ETH`}
            </Box>
            <Box className={styles.collectionName}>
              {`${ethNumberStandardFormatter(
                usdPrice
                  ? parseFloat(
                      formatEther(asset.updatedPriceInfo ? asset.updatedPriceInfo.ETHPrice : asset.priceInfo.ETHPrice)
                    ) * usdPrice
                  : usdPrice,
                true
              )}`}
            </Box>
          </Column>
        )}
      </Row>
    </Link>
  )
}

interface PriceChangeBagRowProps {
  asset: UpdatedGenieAsset
  usdPrice: number | undefined
  markAssetAsReviewed: (asset: UpdatedGenieAsset, toKeep: boolean) => void
  top?: boolean
  isMobile: boolean
}

export const PriceChangeBagRow = ({ asset, usdPrice, markAssetAsReviewed, top, isMobile }: PriceChangeBagRowProps) => {
  const isPriceIncrease = BigNumber.from(asset.updatedPriceInfo?.ETHPrice).gt(BigNumber.from(asset.priceInfo.ETHPrice))
  return (
    <Column className={styles.priceChangeColumn} borderTopColor={top ? 'backgroundOutline' : 'transparent'}>
      <Row className={styles.priceChangeRow}>
        {isPriceIncrease ? <SquareArrowUpIcon /> : <SquareArrowDownIcon />}
        <Box>{`Price ${isPriceIncrease ? 'increased' : 'decreased'} from ${formatWeiToDecimal(
          asset.priceInfo.ETHPrice
        )} ETH`}</Box>
      </Row>
      <Box style={{ marginLeft: '-8px', marginRight: '-8px' }}>
        <BagRow asset={asset} usdPrice={usdPrice} removeAsset={() => undefined} isMobile={isMobile} />
      </Box>
      <Row gap="12" justifyContent="space-between">
        <Box
          className={styles.removeButton}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            markAssetAsReviewed(asset, false)
          }}
        >
          Remove
        </Box>
        <Box
          className={styles.keepButton}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            markAssetAsReviewed(asset, true)
          }}
        >
          Keep
        </Box>
      </Row>
    </Column>
  )
}

interface UnavailableAssetsHeaderRowProps {
  assets?: UpdatedGenieAsset[]
  usdPrice: number | undefined
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
  <Column
    display="grid"
    style={{
      gridTemplateColumns: `repeat(${assets.length}, 20px)`,
      width: `${ASSET_PREVIEW_WIDTH + (assets.length - 1) * ASSET_PREVIEW_OFFSET}px`,
    }}
  >
    {assets.map((asset, index) => (
      <Box
        key={`preview${index}`}
        as="img"
        src={asset.smallImageUrl}
        width="32"
        height="32"
        borderStyle="solid"
        borderWidth="1px"
        borderColor="backgroundSurface"
        borderRadius="4"
        style={{ zIndex: index }}
        className={styles.grayscaleImage}
      />
    ))}
  </Column>
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
      return
    }

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [timeLeft, clearUnavailableAssets, didOpenUnavailableAssets, setDidOpenUnavailableAssets])

  if (!assets || assets.length === 0) return null

  return (
    <Column className={styles.unavailableAssetsContainer}>
      {assets.length === 1 && (
        <BagRow asset={assets[0]} usdPrice={usdPrice} removeAsset={() => undefined} grayscale isMobile={isMobile} />
      )}
      {assets.length > 1 && (
        <Column>
          <Row
            justifyContent="space-between"
            marginBottom={isOpen ? '12' : '0'}
            cursor="pointer"
            onClick={() => {
              !didOpenUnavailableAssets && setDidOpenUnavailableAssets(true)
              toggleOpen()
            }}
          >
            <Row gap="12" color="textPrimary" className={bodySmall}>
              {!isOpen && <UnavailableAssetsPreview assets={assets.slice(0, 5)} />}
              No longer available
            </Row>
            <Row color="textSecondary">{isOpen ? <ChevronUpBagIcon /> : <ChevronDownBagIcon />}</Row>
            {!didOpenUnavailableAssets && (
              <Row
                position="relative"
                width="20"
                height="20"
                color="textPrimary"
                justifyContent="center"
                cursor="pointer"
                onClick={() => clearUnavailableAssets()}
              >
                <TimedLoader />
                <CloseTimerIcon />
              </Row>
            )}
          </Row>
          <Column gap="8" style={{ marginLeft: '-8px', marginRight: '-8px' }}>
            {isOpen &&
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
          </Column>
        </Column>
      )}
    </Column>
  )
}
