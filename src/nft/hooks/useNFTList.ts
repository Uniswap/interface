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
        const updatedListings = listings.map((listing) => {
          const oldStatus = get().listings.find(
            (oldListing) =>
              oldListing.asset.asset_contract.address === listing.asset.asset_contract.address &&
              oldListing.asset.tokenId === listing.asset.tokenId &&
              oldListing.marketplace.name === listing.marketplace.name &&
              oldListing.price === listing.price
          )?.status
          const status = () => {
            switch (oldStatus) {
              case ListingStatus.APPROVED:
                return ListingStatus.APPROVED
              case ListingStatus.FAILED:
                return listing.status === ListingStatus.SIGNING ? ListingStatus.SIGNING : ListingStatus.FAILED
              case ListingStatus.REJECTED:
                return listing.status === ListingStatus.SIGNING ? ListingStatus.SIGNING : ListingStatus.REJECTED
              default:
                return listing.status
            }
          }
          return {
            ...listing,
            status: status(),
          }
        })
        return {
          listings: updatedListings,
        }
      }),
    setCollectionsRequiringApproval: (collections) =>
      set(() => {
        const updatedCollections = collections.map((collection) => {
          const oldStatus = get().collectionsRequiringApproval.find(
            (oldCollection) =>
              oldCollection.collectionAddress === collection.collectionAddress &&
              oldCollection.marketplace.name === collection.marketplace.name
          )?.status
          const status = () => {
            switch (oldStatus) {
              case ListingStatus.APPROVED:
                return ListingStatus.APPROVED
              case ListingStatus.FAILED:
                return collection.status === ListingStatus.SIGNING ? ListingStatus.SIGNING : ListingStatus.FAILED
              case ListingStatus.REJECTED:
                return collection.status === ListingStatus.SIGNING ? ListingStatus.SIGNING : ListingStatus.REJECTED
              default:
                return collection.status
            }
          }
          return {
            ...collection,
            status: status(),
          }
        })
        return {
          collectionsRequiringApproval: updatedCollections,
        }
      }),
  }))
)
