import { useOnClickOutside } from 'hooks/useOnClickOutside'
import ms from 'ms.macro'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { ArrowRightIcon, HazardIcon, LoadingIcon, XMarkIcon } from 'nft/components/icons'
import { bodySmall } from 'nft/css/common.css'
import { useNFTList, useSellAsset } from 'nft/hooks'
import { Listing, ListingStatus, WalletAsset } from 'nft/types'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { useEffect, useMemo, useRef, useState } from 'react'

import * as styles from './ListingModal.css'
import { getListings } from './utils'

interface ListingButtonProps {
  onClick: () => void
  buttonText: string
  showWarningOverride?: boolean
}

export const ListingButton = ({ onClick, buttonText, showWarningOverride = false }: ListingButtonProps) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const addMarketplaceWarning = useSellAsset((state) => state.addMarketplaceWarning)
  const removeAllMarketplaceWarnings = useSellAsset((state) => state.removeAllMarketplaceWarnings)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const setListings = useNFTList((state) => state.setListings)
  const setCollectionsRequiringApproval = useNFTList((state) => state.setCollectionsRequiringApproval)
  const [showWarning, setShowWarning] = useState(false)
  const [canContinue, setCanContinue] = useState(false)
  const warningRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(warningRef, () => {
    setShowWarning(false)
  })

  useEffect(() => {
    const [newCollectionsToApprove, newListings] = getListings(sellAssets)
    setListings(newListings)
    setCollectionsRequiringApproval(newCollectionsToApprove)
    setListingStatus(ListingStatus.DEFINED)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellAssets])

  const [
    noMarketplacesSelected,
    missingExpiration,
    invalidExpiration,
    overMaxExpiration,
    listingsMissingPrice,
    listingsBelowFloor,
    listingsAboveSellOrderFloor,
    invalidPrices,
  ] = useMemo(() => {
    const noMarketplacesSelected = sellAssets.some(
      (asset: WalletAsset) => asset.marketplaces === undefined || asset.marketplaces.length === 0
    )
    const missingExpiration = sellAssets.some((asset) => {
      return asset.expirationTime != null && asset.expirationTime * 1000 - Date.now() < ms`60 seconds`
    })
    const invalidExpiration = sellAssets.some((asset) => {
      return asset.expirationTime != null && isNaN(asset.expirationTime)
    })
    const overMaxExpiration = sellAssets.some((asset) => {
      return asset.expirationTime != null && asset.expirationTime - Date.now() > ms`180 days`
    })
    const listingsMissingPrice: [WalletAsset, Listing][] = []
    const listingsBelowFloor: [WalletAsset, Listing][] = []
    const listingsAboveSellOrderFloor: [WalletAsset, Listing][] = []
    const invalidPrices: [WalletAsset, Listing][] = []
    for (const asset of sellAssets) {
      if (asset.newListings) {
        for (const listing of asset.newListings) {
          if (!listing.price) listingsMissingPrice.push([asset, listing])
          else if (isNaN(listing.price) || listing.price < 0) invalidPrices.push([asset, listing])
          else if (listing.price < asset.floorPrice && !listing.overrideFloorPrice)
            listingsBelowFloor.push([asset, listing])
          else if (asset.floor_sell_order_price && listing.price > asset.floor_sell_order_price)
            listingsAboveSellOrderFloor.push([asset, listing])
        }
      }
    }
    const continueCheck = listingsBelowFloor.length === 0 && listingsAboveSellOrderFloor.length === 0
    setCanContinue(continueCheck)
    return [
      noMarketplacesSelected,
      missingExpiration,
      invalidExpiration,
      overMaxExpiration,
      listingsMissingPrice,
      listingsBelowFloor,
      listingsAboveSellOrderFloor,
      invalidPrices,
    ]
  }, [sellAssets])

  const [disableListButton, warningMessage] = useMemo(() => {
    const disableListButton =
      noMarketplacesSelected ||
      missingExpiration ||
      invalidExpiration ||
      overMaxExpiration ||
      invalidPrices.length > 0 ||
      listingsMissingPrice.length > 0

    const warningMessage = noMarketplacesSelected
      ? 'No marketplaces selected'
      : missingExpiration
      ? 'Set duration'
      : invalidExpiration
      ? 'Invalid duration'
      : overMaxExpiration
      ? 'Max duration is 6 months'
      : listingsMissingPrice.length > 0
      ? `${listingsMissingPrice.length} item price${pluralize(listingsMissingPrice.length)} not set`
      : invalidPrices.length > 0
      ? `${invalidPrices.length} price${pluralize(invalidPrices.length)} are invalid`
      : listingsBelowFloor.length > 0
      ? `${listingsBelowFloor.length} item${pluralize(listingsBelowFloor.length)} listed below floor`
      : listingsAboveSellOrderFloor.length > 0
      ? `${listingsAboveSellOrderFloor.length} item${pluralize(listingsAboveSellOrderFloor.length)} already listed`
      : ''
    return [disableListButton, warningMessage]
  }, [
    noMarketplacesSelected,
    missingExpiration,
    invalidExpiration,
    overMaxExpiration,
    listingsMissingPrice,
    invalidPrices,
    listingsBelowFloor,
    listingsAboveSellOrderFloor,
  ])

  useEffect(() => {
    setShowWarning(false)
  }, [warningMessage])

  const addWarningMessages = () => {
    removeAllMarketplaceWarnings()
    if (!missingExpiration && !noMarketplacesSelected) {
      if (listingsMissingPrice.length > 0) {
        for (const [asset, listing] of listingsMissingPrice) {
          addMarketplaceWarning(asset, {
            message: 'PLEASE SET A PRICE',
            marketplace: listing.marketplace,
          })
        }
      } else if (invalidPrices.length > 0) {
        for (const [asset, listing] of invalidPrices) {
          !listing.overrideFloorPrice &&
            addMarketplaceWarning(asset, {
              message: `INVALID PRICE`,
              marketplace: listing.marketplace,
            })
        }
      }
    }
    setShowWarning(true)
  }

  const warningWrappedClick = () => {
    if ((!disableListButton && canContinue) || showWarningOverride) onClick()
    else addWarningMessages()
  }

  return (
    <Box position="relative" width="full">
      {!showWarningOverride && showWarning && warningMessage.length > 0 && (
        <Row
          className={`${bodySmall} ${styles.warningTooltip}`}
          transition="250"
          onClick={() => setShowWarning(false)}
          color="textSecondary"
          zIndex="3"
          borderRadius="4"
          backgroundColor="backgroundSurface"
          height={!disableListButton ? '64' : '36'}
          maxWidth="276"
          position="absolute"
          left="24"
          bottom="52"
          flexWrap={!disableListButton ? 'wrap' : 'nowrap'}
          style={{ maxWidth: !disableListButton ? '225px' : '' }}
          ref={warningRef}
        >
          <HazardIcon />
          <Box marginLeft="4" marginRight="8">
            {warningMessage}
          </Box>
          {!!disableListButton ? (
            <Box paddingTop="6">
              <XMarkIcon fill="textSecondary" height="20" width="20" />
            </Box>
          ) : (
            <Row
              marginLeft="72"
              cursor="pointer"
              color="genieBlue"
              onClick={() => {
                setShowWarning(false)
                setCanContinue(true)
                onClick()
              }}
            >
              Continue
              <ArrowRightIcon height="20" width="20" />
            </Row>
          )}
        </Row>
      )}
      <Box
        as="button"
        border="none"
        backgroundColor="genieBlue"
        cursor={
          [ListingStatus.APPROVED, ListingStatus.PENDING, ListingStatus.SIGNING].includes(listingStatus) ||
          disableListButton
            ? 'default'
            : 'pointer'
        }
        color="explicitWhite"
        className={styles.button}
        onClick={() => listingStatus !== ListingStatus.APPROVED && warningWrappedClick()}
        type="button"
        style={{
          opacity:
            ![ListingStatus.DEFINED, ListingStatus.FAILED, ListingStatus.CONTINUE].includes(listingStatus) ||
            disableListButton
              ? 0.3
              : 1,
        }}
      >
        {listingStatus === ListingStatus.SIGNING || listingStatus === ListingStatus.PENDING ? (
          <Row gap="8">
            <LoadingIcon stroke="backgroundSurface" height="20" width="20" />
            {listingStatus === ListingStatus.PENDING ? 'Pending' : 'Proceed in wallet'}
          </Row>
        ) : listingStatus === ListingStatus.APPROVED ? (
          'Complete!'
        ) : listingStatus === ListingStatus.PAUSED ? (
          'Paused'
        ) : listingStatus === ListingStatus.FAILED ? (
          'Try again'
        ) : listingStatus === ListingStatus.CONTINUE ? (
          'Continue'
        ) : (
          buttonText
        )}
      </Box>
    </Box>
  )
}
