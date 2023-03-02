import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { addressesByNetwork, SupportedChainId } from '@looksrare/sdk'
import { SetPriceMethod, WarningType } from 'nft/components/profile/list/shared'
import { useNFTList, useSellAsset } from 'nft/hooks'
import { LOOKSRARE_MARKETPLACE_CONTRACT, X2Y2_TRANSFER_CONTRACT } from 'nft/queries'
import { OPENSEA_CROSS_CHAIN_CONDUIT } from 'nft/queries/openSea'
import { CollectionRow, ListingMarket, ListingRow, ListingStatus, WalletAsset } from 'nft/types'
import { approveCollection, LOOKS_RARE_CREATOR_BASIS_POINTS, signListing } from 'nft/utils/listNfts'
import { Dispatch, useEffect } from 'react'
import shallow from 'zustand/shallow'

export async function approveCollectionRow(
  collectionRow: CollectionRow,
  signer: JsonRpcSigner,
  setCollectionStatusAndCallback: (
    collection: CollectionRow,
    status: ListingStatus,
    callback?: () => Promise<void>
  ) => void
) {
  const callback = () => approveCollectionRow(collectionRow, signer, setCollectionStatusAndCallback)
  setCollectionStatusAndCallback(collectionRow, ListingStatus.SIGNING, callback)
  const { marketplace, collectionAddress } = collectionRow
  const addresses = addressesByNetwork[SupportedChainId.MAINNET]
  const spender =
    marketplace.name === 'OpenSea'
      ? OPENSEA_CROSS_CHAIN_CONDUIT
      : marketplace.name === 'Rarible'
      ? LOOKSRARE_MARKETPLACE_CONTRACT
      : marketplace.name === 'X2Y2'
      ? X2Y2_TRANSFER_CONTRACT
      : addresses.TRANSFER_MANAGER_ERC721
  !!collectionAddress &&
    (await approveCollection(spender, collectionAddress, signer, (newStatus: ListingStatus) =>
      setCollectionStatusAndCallback(collectionRow, newStatus, callback)
    ))
}

export async function signListingRow(
  listing: ListingRow,
  signer: JsonRpcSigner,
  provider: Web3Provider,
  getLooksRareNonce: () => number,
  setLooksRareNonce: (nonce: number) => void,
  setListingStatusAndCallback: (listing: ListingRow, status: ListingStatus, callback?: () => Promise<void>) => void
) {
  const looksRareNonce = getLooksRareNonce()
  const callback = () => {
    return signListingRow(listing, signer, provider, getLooksRareNonce, setLooksRareNonce, setListingStatusAndCallback)
  }
  setListingStatusAndCallback(listing, ListingStatus.SIGNING, callback)
  const { asset, marketplace } = listing
  const res = await signListing(marketplace, asset, signer, provider, looksRareNonce, (newStatus: ListingStatus) =>
    setListingStatusAndCallback(listing, newStatus, callback)
  )
  res && listing.marketplace.name === 'LooksRare' && setLooksRareNonce(looksRareNonce + 1)
}

export const getTotalEthValue = (sellAssets: WalletAsset[]) => {
  const total = sellAssets.reduce((total, asset: WalletAsset) => {
    if (asset.newListings?.length) {
      const maxListing = asset.newListings.reduce((a, b) => ((a.price ?? 0) > (b.price ?? 0) ? a : b))
      // LooksRare is a unique case where creator royalties are a flat 0.5% or 50 basis points
      const maxFee =
        maxListing.marketplace.fee +
        (maxListing.marketplace.name === 'LooksRare' ? LOOKS_RARE_CREATOR_BASIS_POINTS : asset?.basisPoints ?? 0) / 100
      return total + (maxListing.price ?? 0) - (maxListing.price ?? 0) * (maxFee / 100)
    }
    return total
  }, 0)
  return total ? Math.round(total * 10000 + Number.EPSILON) / 10000 : 0
}

const getListings = (sellAssets: WalletAsset[]): [CollectionRow[], ListingRow[]] => {
  const newCollectionsToApprove: CollectionRow[] = []

  const newListings: ListingRow[] = []
  sellAssets.forEach((asset) => {
    asset.marketplaces?.forEach((marketplace: ListingMarket) => {
      const newListing = {
        images: [asset.smallImageUrl, marketplace.icon],
        name: asset.name || `#${asset.tokenId}`,
        status: ListingStatus.DEFINED,
        asset,
        marketplace,
        price: asset.newListings?.find((listing) => listing.marketplace.name === marketplace.name)?.price,
      }
      newListings.push(newListing)
      if (
        !newCollectionsToApprove.some(
          (collectionRow: CollectionRow) =>
            collectionRow.collectionAddress === asset.asset_contract.address &&
            collectionRow.marketplace.name === marketplace.name
        )
      ) {
        const newCollectionRow = {
          images: [asset.asset_contract.image_url, marketplace.icon],
          name: asset.asset_contract.name,
          status: ListingStatus.DEFINED,
          collectionAddress: asset.asset_contract.address,
          isVerified: asset.collectionIsVerified,
          marketplace,
        }
        newCollectionsToApprove.push(newCollectionRow)
      }
    })
  })
  return [newCollectionsToApprove, newListings]
}

export const verifyStatus = (status: ListingStatus) => {
  return status !== ListingStatus.PAUSED && status !== ListingStatus.APPROVED
}

export function useSubscribeListingState() {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const { setListings, setCollectionsRequiringApproval } = useNFTList(
    ({ setListings, setCollectionsRequiringApproval }) => ({
      setListings,
      setCollectionsRequiringApproval,
    }),
    shallow
  )
  useEffect(() => {
    const [newCollectionsToApprove, newListings] = getListings(sellAssets)
    setListings(newListings)
    setCollectionsRequiringApproval(newCollectionsToApprove)
  }, [sellAssets, setCollectionsRequiringApproval, setListings])
}

export function useHandleGlobalPriceToggle(
  globalOverride: boolean,
  setListPrice: Dispatch<number | undefined>,
  setPrice: (price?: number) => void,
  listPrice?: number,
  globalPrice?: number
) {
  useEffect(() => {
    let price: number | undefined
    if (globalOverride) {
      if (!listPrice) setListPrice(globalPrice)
      price = globalPrice
    } else {
      price = listPrice
    }
    setPrice(price)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalOverride])
}

export function useSyncPriceWithGlobalMethod(
  asset: WalletAsset,
  setListPrice: Dispatch<number | undefined>,
  setGlobalPrice: Dispatch<number | undefined>,
  setGlobalOverride: Dispatch<boolean>,
  listPrice?: number,
  globalPrice?: number,
  globalPriceMethod?: SetPriceMethod
) {
  useEffect(() => {
    if (globalPriceMethod === SetPriceMethod.FLOOR_PRICE) {
      setListPrice(asset?.floorPrice)
      setGlobalPrice(asset.floorPrice)
    } else if (globalPriceMethod === SetPriceMethod.LAST_PRICE) {
      setListPrice(asset.lastPrice)
      setGlobalPrice(asset.lastPrice)
    } else if (globalPriceMethod === SetPriceMethod.SAME_PRICE)
      listPrice && !globalPrice ? setGlobalPrice(listPrice) : setListPrice(globalPrice)

    setGlobalOverride(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPriceMethod])
}

export function useUpdateInputAndWarnings(
  setWarningType: Dispatch<WarningType>,
  inputRef: React.MutableRefObject<HTMLInputElement>,
  asset: WalletAsset,
  listPrice?: number
) {
  useEffect(() => {
    setWarningType(WarningType.NONE)
    const price = listPrice ?? 0
    inputRef.current.value = `${price}`
    if (price < (asset?.floorPrice ?? 0) && price > 0) setWarningType(WarningType.BELOW_FLOOR)
    else if (asset.floor_sell_order_price && price >= asset.floor_sell_order_price)
      setWarningType(WarningType.ALREADY_LISTED)
  }, [asset?.floorPrice, asset.floor_sell_order_price, inputRef, listPrice, setWarningType])
}

export const getRoyalty = (listingMarket: ListingMarket, asset: WalletAsset) => {
  // LooksRare is a unique case where royalties for creators are a flat 0.5% or 50 basis points
  const baseFee = listingMarket.name === 'LooksRare' ? LOOKS_RARE_CREATOR_BASIS_POINTS : asset.basisPoints ?? 0

  return baseFee * 0.01
}
