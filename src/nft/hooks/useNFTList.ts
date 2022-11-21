import { CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface NFTListState {
  looksRareNonce: number
  listingStatus: ListingStatus
  listings: ListingRow[]
  signedListings: ListingRow[]
  collectionsRequiringApproval: CollectionRow[]
  setLooksRareNonce: (nonce: number) => void
  getLooksRareNonce: () => number
  setListingStatus: (status: ListingStatus) => void
  setListings: (listings: ListingRow[]) => void
  addSignedListing: (signedListing: ListingRow) => void
  setCollectionsRequiringApproval: (collections: CollectionRow[]) => void
}

export const useNFTList = create<NFTListState>()(
  devtools((set, get) => ({
    looksRareNonce: 0,
    listingStatus: ListingStatus.DEFINED,
    listings: [],
    signedListings: [],
    collectionsRequiringApproval: [],
    setLooksRareNonce: (nonce) =>
      set(() => {
        return { looksRareNonce: nonce }
      }),
    getLooksRareNonce: () => {
      return get().looksRareNonce
    },
    setListingStatus: (status) =>
      set(() => {
        return { listingStatus: status }
      }),
    setListings: (listings) =>
      set(() => {
        const updatedListings = listings.map((listing) => {
          const isApproved = !!get().signedListings.find(
            (signedListing) =>
              signedListing.asset.asset_contract.address === listing.asset.asset_contract.address &&
              signedListing.asset.tokenId === listing.asset.tokenId &&
              signedListing.marketplace.name === listing.marketplace.name &&
              signedListing.price === listing.price
          )
          return {
            ...listing,
            status: isApproved ? ListingStatus.APPROVED : listing.status,
          }
        })
        return {
          listings: updatedListings,
        }
      }),
    addSignedListing: (signedListing) =>
      set(() => {
        const signedListings = get().signedListings
        signedListings.push(signedListing)
        return { signedListings }
      }),
    setCollectionsRequiringApproval: (collections) =>
      set(() => {
        return { collectionsRequiringApproval: collections }
      }),
  }))
)
