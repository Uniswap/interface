import { CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface NFTListState {
  looksRareNonce: number
  listingStatus: ListingStatus
  listings: ListingRow[]
  collectionsRequiringApproval: CollectionRow[]
  setLooksRareNonce: (nonce: number) => void
  getLooksRareNonce: () => number
  setListingStatus: (status: ListingStatus) => void
  setListings: (listings: ListingRow[]) => void
  setCollectionsRequiringApproval: (collections: CollectionRow[]) => void
}

export const useNFTList = create<NFTListState>()(
  devtools((set, get) => ({
    looksRareNonce: 0,
    listingStatus: ListingStatus.DEFINED,
    listings: [],
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
        return { listings }
      }),
    setCollectionsRequiringApproval: (collections) =>
      set(() => {
        return { collectionsRequiringApproval: collections }
      }),
  }))
)
