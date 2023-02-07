import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceModalName, NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ChevronLeftIcon, XMarkIcon } from 'nft/components/icons'
import { caption, headlineSmall, subhead, subheadSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useNFTList, useSellAsset } from 'nft/hooks'
import { logListing, looksRareNonceFetcher } from 'nft/queries'
import { AssetRow, CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { Dispatch, useEffect, useMemo, useRef, useState } from 'react'
import shallow from 'zustand/shallow'

import { ListingButton } from './ListingButton'
import * as styles from './ListingModal.css'
import { ListingSection } from './ListingSection'
import { approveCollectionRow, getTotalEthValue, pauseRow, resetRow, signListingRow, verifyStatus } from './utils'

const ListingModal = () => {
  const { provider } = useWeb3React()
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const {
    listingStatus,
    setListingStatus,
    setListings,
    setCollectionsRequiringApproval,
    setListingStatusAndCallback,
    setCollectionStatusAndCallback,
    looksRareNonce,
    setLooksRareNonce,
    getLooksRareNonce,
    collectionsRequiringApproval,
    listings,
  } = useNFTList(
    ({
      listingStatus,
      setListingStatus,
      setListings,
      setCollectionsRequiringApproval,
      setListingStatusAndCallback,
      setCollectionStatusAndCallback,
      looksRareNonce,
      setLooksRareNonce,
      getLooksRareNonce,
      collectionsRequiringApproval,
      listings,
    }) => ({
      listingStatus,
      setListingStatus,
      setListings,
      setCollectionsRequiringApproval,
      setListingStatusAndCallback,
      setCollectionStatusAndCallback,
      looksRareNonce,
      setLooksRareNonce,
      getLooksRareNonce,
      collectionsRequiringApproval,
      listings,
    }),
    shallow
  )
  const signer = provider?.getSigner()
  const [openIndex, setOpenIndex] = useState(0)
  const [allCollectionsApproved, setAllCollectionsApproved] = useState(false)
  const toggleCart = useBag((state) => state.toggleBag)
  const looksRareNonceRef = useRef(looksRareNonce)
  const isMobile = useIsMobile()
  const trace = useTrace({ modal: InterfaceModalName.NFT_LISTING })

  useEffect(() => {
    useNFTList.subscribe((state) => (looksRareNonceRef.current = state.looksRareNonce))
  }, [])

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])

  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  const startListingEventProperties = {
    collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
    token_ids: sellAssets.map((asset) => asset.tokenId),
    marketplaces: Array.from(new Set(listings.map((asset) => asset.marketplace.name))),
    list_quantity: listings.length,
    usd_value: ethPriceInUSD * totalEthListingValue,
    ...trace,
  }

  // when all collections have been approved, auto start the signing process
  useEffect(() => {
    collectionsRequiringApproval?.length &&
      setAllCollectionsApproved(
        collectionsRequiringApproval.every((collection: CollectionRow) => collection.status === ListingStatus.APPROVED)
      )
    if (
      allCollectionsApproved &&
      (listingStatus === ListingStatus.PENDING ||
        listingStatus === ListingStatus.CONTINUE ||
        listingStatus === ListingStatus.SIGNING)
    ) {
      resetAllRows()
      signListings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionsRequiringApproval, allCollectionsApproved])

  const allCollectionsApprovedOrPaused = useMemo(
    () =>
      collectionsRequiringApproval.every(
        (collection: CollectionRow) =>
          collection.status === ListingStatus.APPROVED || collection.status === ListingStatus.PAUSED
      ),
    [collectionsRequiringApproval]
  )
  const allListingsApprovedOrPaused = useMemo(
    () =>
      listings.every(
        (listing: ListingRow) => listing.status === ListingStatus.APPROVED || listing.status === ListingStatus.PAUSED
      ),
    [listings]
  )

  // go back to a ready state after a successful retry
  useEffect(() => {
    if (listingStatus === ListingStatus.SIGNING && allCollectionsApprovedOrPaused && allListingsApprovedOrPaused) {
      resetAllRows()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCollectionsApprovedOrPaused, allListingsApprovedOrPaused])

  // handles the modal wide listing state based on conglomeration of the wallet, collection, and listing states
  const startListingFlow = async () => {
    if (!signer) return
    sendAnalyticsEvent(NFTEventName.NFT_SELL_START_LISTING, { ...startListingEventProperties })
    setListingStatus(ListingStatus.SIGNING)
    const signerAddress = await signer.getAddress()
    const nonce = await looksRareNonceFetcher(signerAddress)
    setLooksRareNonce(nonce ?? 0)

    if (!collectionsRequiringApproval?.some((collection) => collection.status === ListingStatus.PAUSED)) {
      setListingStatus(ListingStatus.SIGNING)
      setOpenIndex(1)
    }
    // for all unique collection, marketplace combos -> approve collections
    for (const collectionRow of collectionsRequiringApproval) {
      verifyStatus(collectionRow.status) &&
        (isMobile
          ? await approveCollectionRow(collectionRow, signer, setCollectionStatusAndCallback, pauseAllRows)
          : approveCollectionRow(collectionRow, signer, setCollectionStatusAndCallback, pauseAllRows))
    }
  }

  const signListings = async () => {
    if (!signer || !provider) return
    setListingStatus(ListingStatus.SIGNING)
    setOpenIndex(2)
    // sign listings
    for (const listing of listings) {
      verifyStatus(listing.status) &&
        (await signListingRow(
          listing,
          signer,
          provider,
          getLooksRareNonce,
          setLooksRareNonce,
          setListingStatusAndCallback,
          pauseAllRows
        ))
    }
    const allListingsSigned = listings.every((listing: ListingRow) => listing.status === ListingStatus.APPROVED)
    const paused = listings.some((listing: ListingRow) => listing.status === ListingStatus.PAUSED)
    if (allListingsSigned) {
      setOpenIndex(0)
      setListingStatus(ListingStatus.APPROVED)
    } else if (!paused) {
      setListingStatus(ListingStatus.FAILED)
    }
    sendAnalyticsEvent(NFTEventName.NFT_LISTING_COMPLETED, {
      signatures_approved: listings.filter((asset) => asset.status === ListingStatus.APPROVED),
      list_quantity: listings.length,
      usd_value: ethPriceInUSD * totalEthListingValue,
      ...trace,
    })
    await logListing(listings, (await signer?.getAddress()) ?? '')
  }

  const pauseAllRows = () => {
    for (const collection of collectionsRequiringApproval) {
      pauseRow(collection, collectionsRequiringApproval, setCollectionsRequiringApproval as Dispatch<AssetRow[]>)
    }
    for (const listing of listings) {
      pauseRow(listing, listings, setListings as Dispatch<AssetRow[]>)
    }
  }

  const resetAllRows = () => {
    for (const collection of collectionsRequiringApproval) {
      resetRow(collection, collectionsRequiringApproval, setCollectionsRequiringApproval as Dispatch<AssetRow[]>)
    }
    for (const listing of listings) {
      resetRow(listing, listings, setListings as Dispatch<AssetRow[]>)
    }
  }

  const clickStopListing = () => {
    pauseAllRows()
  }

  const clickStartListingFlow = () => {
    resetAllRows()
    allCollectionsApproved ? signListings() : startListingFlow()
  }

  const showSuccessScreen = useMemo(() => listingStatus === ListingStatus.APPROVED, [listingStatus])

  return (
    <Trace modal={InterfaceModalName.NFT_LISTING}>
      <Column paddingTop="20" paddingBottom="20" paddingLeft="12" paddingRight="12">
        <Row className={headlineSmall} marginBottom="10">
          {isMobile && !showSuccessScreen && (
            <Box paddingTop="4" marginRight="4" onClick={toggleCart}>
              <ChevronLeftIcon height={28} width={28} />
            </Box>
          )}
          {showSuccessScreen ? 'Success!' : `Listing ${sellAssets.length} NFTs`}
          <Box
            as="button"
            border="none"
            color="textSecondary"
            backgroundColor="backgroundSurface"
            marginLeft="auto"
            marginRight="0"
            paddingRight="0"
            display={{ sm: 'flex', md: 'none' }}
            cursor="pointer"
            onClick={toggleCart}
          >
            <XMarkIcon height={28} width={28} fill={themeVars.colors.textPrimary} />
          </Box>
        </Row>
        <Column overflowX="hidden" overflowY="auto" style={{ maxHeight: '60vh' }}>
          {showSuccessScreen ? (
            <Trace
              name={NFTEventName.NFT_LISTING_COMPLETED}
              properties={{ list_quantity: listings.length, usd_value: ethPriceInUSD * totalEthListingValue, ...trace }}
              shouldLogImpression
            >
              <ListingSection
                sectionTitle={`Listed ${listings.length} item${pluralize(listings.length)} for sale`}
                rows={listings}
                index={0}
                openIndex={openIndex}
                isSuccessScreen={true}
              />
            </Trace>
          ) : (
            <>
              <ListingSection
                sectionTitle={`Approve ${collectionsRequiringApproval.length} collection${pluralize(
                  collectionsRequiringApproval.length
                )}`}
                title="COLLECTIONS"
                rows={collectionsRequiringApproval}
                index={1}
                openIndex={openIndex}
              />
              <ListingSection
                sectionTitle={`Confirm ${listings.length} listing${pluralize(listings.length)}`}
                caption="Now you can sign to list each item"
                title="NFTS"
                rows={listings}
                index={2}
                openIndex={openIndex}
              />
            </>
          )}
        </Column>
        <hr className={styles.sectionDivider} />
        <Row className={subhead} marginTop="12" marginBottom={showSuccessScreen ? '8' : '20'}>
          Return if sold
          <Row className={subheadSmall} marginLeft="auto" marginRight="0">
            {totalEthListingValue}
            &nbsp;ETH
          </Row>
        </Row>
        {showSuccessScreen ? (
          <Box as="span" className={caption} color="textSecondary">
            Status:{' '}
            <Box as="span" color="accentSuccess">
              Confirmed
            </Box>
          </Box>
        ) : (
          <ListingButton onClick={clickStartListingFlow} buttonText="Start listing" showWarningOverride={isMobile} />
        )}
        {(listingStatus === ListingStatus.PENDING || listingStatus === ListingStatus.SIGNING) && (
          <Box
            as="button"
            border="none"
            backgroundColor="backgroundSurface"
            cursor="pointer"
            color="orange"
            className={styles.button}
            onClick={clickStopListing}
            type="button"
          >
            Stop listing
          </Box>
        )}
      </Column>
    </Trace>
  )
}

export default ListingModal
