import { Plural, t, Trans } from '@lingui/macro'
import ms from 'ms.macro'
import { Box } from 'nft/components/Box'
import { BelowFloorWarningModal } from 'nft/components/profile/list/Modal/BelowFloorWarningModal'
import { useNFTList, useSellAsset } from 'nft/hooks'
import { Listing, ListingStatus, WalletAsset } from 'nft/types'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'styled-components/macro'
import shallow from 'zustand/shallow'

import * as styles from './ListingModal.css'
import { getListings } from './utils'

const BELOW_FLOOR_PRICE_THRESHOLD = 0.8

interface ListingButtonProps {
  onClick: () => void
  buttonText: string
  showWarningOverride?: boolean
}

export const ListingButton = ({ onClick, buttonText, showWarningOverride = false }: ListingButtonProps) => {
  const {
    addMarketplaceWarning,
    sellAssets,
    removeAllMarketplaceWarnings,
    showResolveIssues,
    toggleShowResolveIssues,
    issues,
    setIssues,
  } = useSellAsset(
    ({
      addMarketplaceWarning,
      sellAssets,
      removeAllMarketplaceWarnings,
      showResolveIssues,
      toggleShowResolveIssues,
      issues,
      setIssues,
    }) => ({
      addMarketplaceWarning,
      sellAssets,
      removeAllMarketplaceWarnings,
      showResolveIssues,
      toggleShowResolveIssues,
      issues,
      setIssues,
    }),
    shallow
  )
  const { listingStatus, setListingStatus, setListings, setCollectionsRequiringApproval } = useNFTList(
    ({ listingStatus, setListingStatus, setListings, setCollectionsRequiringApproval }) => ({
      listingStatus,
      setListingStatus,
      setListings,
      setCollectionsRequiringApproval,
    }),
    shallow
  )
  const [showWarning, setShowWarning] = useState(false)
  const [canContinue, setCanContinue] = useState(false)
  const theme = useTheme()

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
    const noMarketplacesSelected = sellAssets.some((asset: WalletAsset) => asset.marketplaces === undefined)
    const missingExpiration = sellAssets.some((asset) => {
      return (
        asset.expirationTime != null &&
        (isNaN(asset.expirationTime) || asset.expirationTime * 1000 - Date.now() < ms`60 seconds`)
      )
    })
    const invalidExpiration = sellAssets.some((asset) => {
      return asset.expirationTime != null && isNaN(asset.expirationTime)
    })
    const overMaxExpiration = sellAssets.some((asset) => {
      return asset.expirationTime != null && asset.expirationTime * 1000 - Date.now() > ms`180 days`
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
          else if (
            listing.price < (asset?.floorPrice ?? 0) * BELOW_FLOOR_PRICE_THRESHOLD &&
            !listing.overrideFloorPrice
          )
            listingsBelowFloor.push([asset, listing])
          else if (asset.floor_sell_order_price && listing.price >= asset.floor_sell_order_price)
            listingsAboveSellOrderFloor.push([asset, listing])
        }
      }
    }
    // set number of issues

    const foundIssues =
      Number(missingExpiration) +
      Number(overMaxExpiration) +
      listingsMissingPrice.length +
      listingsAboveSellOrderFloor.length
    setIssues(foundIssues)
    !foundIssues && showResolveIssues && toggleShowResolveIssues()
    // Only show Resolve Issue text if there was a user submitted error (ie not when page loads with no prices set)
    if ((missingExpiration || overMaxExpiration || listingsAboveSellOrderFloor.length) && !showResolveIssues)
      toggleShowResolveIssues()

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
  }, [sellAssets, setIssues, showResolveIssues, toggleShowResolveIssues])

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
    if ((!disableListButton && canContinue) || showWarningOverride) {
      if (issues) !showResolveIssues && toggleShowResolveIssues()
      else if (listingsBelowFloor.length) setShowWarning(true)
      else onClick()
    } else addWarningMessages()
  }

  return (
    <>
      <Box position="relative">
        <Box
          as="button"
          border="none"
          backgroundColor={showResolveIssues ? 'accentFailure' : 'accentAction'}
          cursor={
            [ListingStatus.APPROVED, ListingStatus.PENDING, ListingStatus.SIGNING].includes(listingStatus) ||
            disableListButton
              ? 'default'
              : 'pointer'
          }
          className={styles.button}
          onClick={() => listingStatus !== ListingStatus.APPROVED && warningWrappedClick()}
          type="button"
          style={{
            color: showResolveIssues ? theme.accentTextLightPrimary : theme.white,
            opacity:
              ![ListingStatus.DEFINED, ListingStatus.FAILED, ListingStatus.CONTINUE].includes(listingStatus) ||
              (disableListButton && !showResolveIssues)
                ? 0.3
                : 1,
          }}
        >
          {listingStatus === ListingStatus.SIGNING ? (
            <Trans>Proceed in wallet</Trans>
          ) : listingStatus === ListingStatus.PENDING ? (
            <Trans>Pending</Trans>
          ) : listingStatus === ListingStatus.APPROVED ? (
            <Trans>Complete!</Trans>
          ) : listingStatus === ListingStatus.PAUSED ? (
            <Trans>Paused</Trans>
          ) : listingStatus === ListingStatus.FAILED ? (
            <Trans>Try again</Trans>
          ) : listingStatus === ListingStatus.CONTINUE ? (
            <Trans>Continue</Trans>
          ) : showResolveIssues ? (
            <Plural value={issues !== 1 ? 2 : 1} _1="Resolve issue" other={t`Resolve ${issues} issues`} />
          ) : (
            buttonText
          )}
        </Box>
      </Box>
      {showWarning && (
        <BelowFloorWarningModal
          listingsBelowFloor={listingsBelowFloor}
          closeModal={() => setShowWarning(false)}
          startListing={onClick}
        />
      )}
    </>
  )
}
