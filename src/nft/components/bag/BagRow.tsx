import { BigNumber } from '@ethersproject/bignumber'
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
import { loadingBlock } from 'nft/css/loading.css'
import { GenieAsset, UpdatedGenieAsset } from 'nft/types'
import { getAssetHref } from 'nft/utils/asset'
import { formatWeiToDecimal } from 'nft/utils/currency'
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
  removeAsset: (asset: GenieAsset) => void
  showRemove?: boolean
  grayscale?: boolean
  isMobile: boolean
}

export const BagRow = ({ asset, removeAsset, showRemove, grayscale, isMobile }: BagRowProps) => {
  const [cardHovered, setCardHovered] = useState(false)
  const [loadedImage, setImageLoaded] = useState(false)
  const [noImageAvailable, setNoImageAvailable] = useState(!asset.smallImageUrl)
  const handleCardHover = () => setCardHovered(!cardHovered)
  const assetCardRef = useRef<HTMLDivElement>(null)

  if (cardHovered && assetCardRef.current && assetCardRef.current.matches(':hover') === false) setCardHovered(false)

  return (
    <Link to={getAssetHref(asset)} style={{ textDecoration: 'none' }}>
      <Row ref={assetCardRef} className={styles.bagRow} onMouseEnter={handleCardHover} onMouseLeave={handleCardHover}>
        <Box position="relative" display="flex">
          <Box
            display={showRemove ? 'block' : 'none'}
            className={styles.removeAssetOverlay}
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              removeAsset(asset)
            }}
            transition="250"
            style={{ opacity: cardHovered || isMobile ? '1' : '0' }}
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
        <Column
          overflow="hidden"
          height="full"
          justifyContent="space-between"
          color={grayscale ? 'darkGray' : 'blackBlue'}
        >
          <Column>
            <Row overflow="hidden" whiteSpace="nowrap" gap="2">
              <Box className={styles.assetName}>{asset.name || asset.tokenId}</Box>
            </Row>
            <Row overflow="hidden" whiteSpace="nowrap" gap="2">
              <Box className={styles.collectionName}>{asset.collectionName}</Box>
              {asset.collectionIsVerified && <VerifiedIcon className={styles.icon} />}
            </Row>
          </Column>
          <Row className={styles.bagRowPrice}>
            {`${formatWeiToDecimal(
              asset.updatedPriceInfo ? asset.updatedPriceInfo.ETHPrice : asset.priceInfo.ETHPrice
            )} ETH`}
          </Row>
        </Column>
      </Row>
    </Link>
  )
}

interface PriceChangeBagRowProps {
  asset: UpdatedGenieAsset
  markAssetAsReviewed: (asset: UpdatedGenieAsset, toKeep: boolean) => void
  top?: boolean
  isMobile: boolean
}

export const PriceChangeBagRow = ({ asset, markAssetAsReviewed, top, isMobile }: PriceChangeBagRowProps) => {
  const isPriceIncrease = BigNumber.from(asset.updatedPriceInfo?.ETHPrice).gt(BigNumber.from(asset.priceInfo.ETHPrice))
  return (
    <Column className={styles.priceChangeColumn} borderTopColor={top ? 'medGray' : 'transparent'}>
      <Row className={styles.priceChangeRow}>
        {isPriceIncrease ? <SquareArrowUpIcon /> : <SquareArrowDownIcon />}
        <Box>{`Price ${isPriceIncrease ? 'increased' : 'decreased'} from ${formatWeiToDecimal(
          asset.priceInfo.ETHPrice
        )} ETH`}</Box>
      </Row>
      <BagRow asset={asset} removeAsset={() => undefined} isMobile={isMobile} />
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
        borderColor="lightGray"
        borderRadius="4"
        style={{ zIndex: assets.length - index }}
        className={styles.grayscaleImage}
      />
    ))}
  </Column>
)

export const UnavailableAssetsHeaderRow = ({
  assets,
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
      <Row className={styles.priceChangeRow} justifyContent="space-between">
        No longer available for sale
        {!didOpenUnavailableAssets && (
          <Row
            position="relative"
            width="20"
            height="20"
            color="blackBlue"
            justifyContent="center"
            cursor="pointer"
            onClick={() => clearUnavailableAssets()}
          >
            <TimedLoader />
            <CloseTimerIcon />
          </Row>
        )}
      </Row>
      {assets.length === 1 && <BagRow asset={assets[0]} removeAsset={() => undefined} grayscale isMobile={isMobile} />}
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
            <Row gap="12" fontSize="14" color="darkGray" fontWeight="normal" style={{ lineHeight: '20px' }}>
              {!isOpen && <UnavailableAssetsPreview assets={assets.slice(0, 5)} />}
              {`${assets.length} unavailable NFTs`}
            </Row>
            <Row color="darkGray">{isOpen ? <ChevronUpBagIcon /> : <ChevronDownBagIcon />}</Row>
          </Row>
          <Column gap="8">
            {isOpen &&
              assets.map((asset) => (
                <BagRow key={asset.id} asset={asset} removeAsset={() => undefined} grayscale isMobile={isMobile} />
              ))}
          </Column>
        </Column>
      )}
    </Column>
  )
}
