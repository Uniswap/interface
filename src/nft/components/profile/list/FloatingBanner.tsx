import { addressesByNetwork, SupportedChainId } from '@looksrare/sdk'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { EventName, ModalName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { ListingButton } from 'nft/components/bag/profile/ListingButton'
import {
  approveCollectionRow,
  getTotalEthValue,
  pauseRow,
  resetRow,
  signListingRow,
  verifyStatus,
} from 'nft/components/bag/profile/utils'
import { useIsMobile, useNFTList, useSellAsset } from 'nft/hooks'
import { logListing, looksRareNonceFetcher } from 'nft/queries'
import { AssetRow, Listing, ListingRow, ListingStatus, WalletAsset } from 'nft/types'
import { formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { Dispatch, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FloatBContainer = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
  width: calc(100% - 360px);
  left: calc((100% - 360px) / 2);
  transform: translateX(-50%);
  padding-top: 48px;
  padding-bottom: 48px;
`

const FloatingBannerContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  display: flex;
  width: 900px;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
`

const Content = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

export const FloatingBanner = () => {
  const [allCollectionsApproved] = useState(false)
  const setCollectionsRequiringApproval = useNFTList((state) => state.setCollectionsRequiringApproval)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const listings = useNFTList((state) => state.listings)
  const setListings = useNFTList((state) => state.setListings)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const { provider } = useWeb3React()
  const signer = provider?.getSigner()
  const [, setOpenIndex] = useState(0)
  const getLooksRareNonce = useNFTList((state) => state.getLooksRareNonce)
  const setLooksRareNonce = useNFTList((state) => state.setLooksRareNonce)
  const [ethPriceInUSD] = useState(0)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const trace = useTrace({ modal: ModalName.NFT_LISTING })
  const isMobile = useIsMobile()
  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const [ethConversion, setEthConversion] = useState(3000)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthConversion(price ?? 0)
    })
  }, [])

  const resetAllRows = () => {
    for (const collection of collectionsRequiringApproval) {
      resetRow(collection, collectionsRequiringApproval, setCollectionsRequiringApproval as Dispatch<AssetRow[]>)
    }
    for (const listing of listings) {
      resetRow(listing, listings, setListings as Dispatch<AssetRow[]>)
    }
  }

  const pauseAllRows = () => {
    for (const collection of collectionsRequiringApproval) {
      pauseRow(collection, collectionsRequiringApproval, setCollectionsRequiringApproval as Dispatch<AssetRow[]>)
    }
    for (const listing of listings) {
      pauseRow(listing, listings, setListings as Dispatch<AssetRow[]>)
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

    const approvalEventProperties = {
      list_quantity: listings.length,
      usd_value: ethPriceInUSD * totalEthListingValue,
      ...trace,
    }

    if (allListingsSigned) {
      setOpenIndex(0)
      setListingStatus(ListingStatus.APPROVED)
    } else if (!paused) {
      setListingStatus(ListingStatus.FAILED)
    }
    sendAnalyticsEvent(EventName.NFT_LISTING_COMPLETED, {
      signatures_requested: listings.length,
      signatures_approved: listings.filter((asset) => asset.status === ListingStatus.APPROVED),
      ...approvalEventProperties,
    })
    await logListing(listings, (await signer?.getAddress()) ?? '')
  }

  const clickStartListingFlow = () => {
    resetAllRows()
    allCollectionsApproved ? signListings() : startListingFlow()
  }

  const startListingEventProperties = {
    collection_addresses: sellAssets.map((asset) => asset.asset_contract.address),
    token_ids: sellAssets.map((asset) => asset.tokenId),
    marketplaces: Array.from(new Set(listings.map((asset) => asset.marketplace.name))),
    list_quantity: listings.length,
    usd_value: ethPriceInUSD * totalEthListingValue,
    ...trace,
  }

  const startListingFlow = async () => {
    if (!signer) return
    sendAnalyticsEvent(EventName.NFT_SELL_START_LISTING, { ...startListingEventProperties })
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
    // for all unique collection, marketplace combos -> approve collections
    for (const collectionRow of collectionsRequiringApproval) {
      verifyStatus(collectionRow.status) &&
        (isMobile
          ? await approveCollectionRow(
              collectionRow,
              collectionsRequiringApproval,
              setCollectionsRequiringApproval,
              signer,
              looksRareAddress,
              pauseAllRows
            )
          : approveCollectionRow(
              collectionRow,
              collectionsRequiringApproval,
              setCollectionsRequiringApproval,
              signer,
              looksRareAddress,
              pauseAllRows
            ))
    }
  }

  const listingsMissingPrice = useMemo(() => {
    const listingsMissingPrice: [WalletAsset, Listing][] = []

    for (const asset of sellAssets) {
      if (asset.newListings) {
        for (const listing of asset.newListings) {
          if (!listing.price) listingsMissingPrice.push([asset, listing])
        }
      }
    }

    return listingsMissingPrice.length > 0
  }, [sellAssets])

  return (
    <FloatBContainer>
      <FloatingBannerContainer>
        <ThemedText.HeadlineSmall fontWeight={500}>Proceeds if sold</ThemedText.HeadlineSmall>
        <Content>
          <ThemedText.HeadlineSmall
            color={totalEthListingValue === 0 ? 'textSecondary' : 'textPrimary'}
            fontWeight={500}
          >
            {' '}
            {totalEthListingValue === 0 ? '-' : totalEthListingValue} ETH
          </ThemedText.HeadlineSmall>
          {totalEthListingValue !== 0 && (
            <ThemedText.HeadlineSmall color="textSecondary" fontWeight={500}>
              {formatUsdPrice(totalEthListingValue * ethConversion)}
            </ThemedText.HeadlineSmall>
          )}

          <span style={{ maxWidth: 200 }}>
            <ListingButton
              onClick={clickStartListingFlow}
              buttonText={listingsMissingPrice ? 'Set prices to continue' : 'Start listing'}
            ></ListingButton>
          </span>
        </Content>
      </FloatingBannerContainer>
    </FloatBContainer>
  )
}
