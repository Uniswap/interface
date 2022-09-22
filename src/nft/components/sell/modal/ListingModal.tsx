import { addressesByNetwork, SupportedChainId } from '@looksrare/sdk'
import { useWeb3React } from '@web3-react/core'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ChevronLeftIcon, XMarkIcon } from 'nft/components/icons'
import { caption, headlineSmall, subhead, subheadSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useNFTList, useSellAsset } from 'nft/hooks'
import { logListing, looksRareNonceFetcher } from 'nft/queries'
import { AssetRow, CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { Dispatch, useEffect, useMemo, useRef, useState } from 'react'

import { ListingButton } from './ListingButton'
import * as styles from './ListingModal.css'
import { ListingSection } from './ListingSection'
import { approveCollectionRow, getTotalEthValue, pauseRow, resetRow, signListingRow, verifyStatus } from './utils'

const ListingModal = () => {
  const { provider } = useWeb3React()
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const signer = provider?.getSigner()
  const listings = useNFTList((state) => state.listings)
  const setListings = useNFTList((state) => state.setListings)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const setCollectionsRequiringApproval = useNFTList((state) => state.setCollectionsRequiringApproval)
  const [openIndex, setOpenIndex] = useState(0)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const [allCollectionsApproved, setAllCollectionsApproved] = useState(false)
  const looksRareNonce = useNFTList((state) => state.looksRareNonce)
  const setLooksRareNonce = useNFTList((state) => state.setLooksRareNonce)
  const getLooksRareNonce = useNFTList((state) => state.getLooksRareNonce)
  const toggleCart = useBag((state) => state.toggleBag)
  const looksRareNonceRef = useRef(looksRareNonce)
  const isMobile = useIsMobile()

  useEffect(() => {
    useNFTList.subscribe((state) => (looksRareNonceRef.current = state.looksRareNonce))
  }, [])

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])

  // when all collections have been approved, auto start the signing process
  useEffect(() => {
    collectionsRequiringApproval?.length &&
      setAllCollectionsApproved(
        collectionsRequiringApproval.every((collection: CollectionRow) => collection.status === ListingStatus.APPROVED)
      )
    if (
      allCollectionsApproved &&
      (listingStatus === ListingStatus.PENDING || listingStatus === ListingStatus.CONTINUE)
    ) {
      signListings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionsRequiringApproval, allCollectionsApproved])

  // handles the modal wide listing state based on conglomeration of the wallet, collection, and listing states

  const startListingFlow = async () => {
    if (!signer) return
    setListingStatus(ListingStatus.SIGNING)
    const addresses = addressesByNetwork[SupportedChainId.MAINNET]
    const signerAddress = await signer.getAddress()
    const nonce = await looksRareNonceFetcher(signerAddress)
    setLooksRareNonce(nonce ?? 0)

    if (!collectionsRequiringApproval?.some((collection) => collection.status === ListingStatus.PAUSED)) {
      setListingStatus(ListingStatus.SIGNING)
      setOpenIndex(1)
    }
    const looksRareAddress = addresses.TRANSFER_MANAGER_ERC721
    // for all unqiue collection, marketplace combos -> approve collections
    for (const collectionRow of collectionsRequiringApproval) {
      verifyStatus(collectionRow.status) &&
        approveCollectionRow(
          collectionRow,
          collectionsRequiringApproval,
          setCollectionsRequiringApproval,
          signer,
          looksRareAddress,
          pauseAllRows
        )
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
          listings,
          setListings,
          signer,
          provider,
          getLooksRareNonce,
          setLooksRareNonce,
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
          <ListingSection
            sectionTitle={`Listed ${listings.length} item${pluralize(listings.length)} for sale`}
            rows={listings}
            index={0}
            openIndex={openIndex}
            isSuccessScreen={true}
          />
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
          <Box as="span" color="green200">
            Confirmed
          </Box>
        </Box>
      ) : (
        <ListingButton onClick={clickStartListingFlow} buttonText={'Start listing'} showWarningOverride={isMobile} />
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
  )
}

export default ListingModal
