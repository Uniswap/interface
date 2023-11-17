import { CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { devtools } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

interface NFTListState {
  looksRareNonce: number
  listings: ListingRow[]
  collectionsRequiringApproval: CollectionRow[]
  setLooksRareNonce: (nonce: number) => void
  getLooksRareNonce: () => number
  setListings: (listings: ListingRow[]) => void
  setCollectionsRequiringApproval: (collections: CollectionRow[]) => void
  setListingStatusAndCallback: (listing: ListingRow, status: ListingStatus, callback?: () => Promise<void>) => void
  setCollectionStatusAndCallback: (
    collection: CollectionRow,
    status: ListingStatus,
    callback?: () => Promise<void>
  ) => void
}

export const useNFTList = createWithEqualityFn<NFTListState>()(
  devtools((set, get) => ({
    looksRareNonce: 0,
    listings: [],
    collectionsRequiringApproval: [],
    setLooksRareNonce: (nonce) =>
      set(() => {
        return { looksRareNonce: nonce }
      }),
    getLooksRareNonce: () => {
      return get().looksRareNonce
    },
    setListings: (listings) =>
      set(() => {
        const updatedListings = listings.map((listing) => {
          const oldListing = get().listings.find(
            (oldListing) =>
              oldListing.asset.asset_contract.address === listing.asset.asset_contract.address &&
              oldListing.asset.tokenId === listing.asset.tokenId &&
              oldListing.marketplace.name === listing.marketplace.name &&
              oldListing.price === listing.price
          )
          const oldStatus = oldListing?.status
          const oldCallback = oldListing?.callback
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
            callback: oldCallback ?? listing.callback,
          }
        })
        return {
          listings: updatedListings,
        }
      }),
    setCollectionsRequiringApproval: (collections) =>
      set(() => {
        const updatedCollections = collections.map((collection) => {
          const oldCollection = get().collectionsRequiringApproval.find(
            (oldCollection) =>
              oldCollection.collectionAddress === collection.collectionAddress &&
              oldCollection.marketplace.name === collection.marketplace.name
          )
          const oldStatus = oldCollection?.status
          const oldCallback = oldCollection?.callback
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
            callback: oldCallback ?? collection.callback,
          }
        })
        return {
          collectionsRequiringApproval: updatedCollections,
        }
      }),
    setListingStatusAndCallback: (listing, status, callback) =>
      set(({ listings }) => {
        const listingsCopy = [...listings]
        const oldListingIndex = listingsCopy.findIndex(
          (oldListing) =>
            oldListing.name === listing.name &&
            oldListing.price === listing.price &&
            oldListing.marketplace.name === listing.marketplace.name
        )
        if (oldListingIndex > -1) {
          const updatedListing = {
            ...listings[oldListingIndex],
            status,
            callback: callback ?? listings[oldListingIndex].callback,
          }
          listingsCopy.splice(oldListingIndex, 1, updatedListing)
        }
        return {
          listings: listingsCopy,
        }
      }),
    setCollectionStatusAndCallback: (collection, status, callback) =>
      set(({ collectionsRequiringApproval }) => {
        const collectionsCopy = [...collectionsRequiringApproval]
        const oldCollectionIndex = collectionsCopy.findIndex(
          (oldCollection) =>
            oldCollection.name === collection.name && oldCollection.marketplace.name === collection.marketplace.name
        )
        if (oldCollectionIndex > -1) {
          const updatedCollection = {
            ...collectionsCopy[oldCollectionIndex],
            status,
            callback: callback ?? collectionsCopy[oldCollectionIndex].callback,
          }
          collectionsCopy.splice(oldCollectionIndex, 1, updatedCollection)
        }
        return {
          collectionsRequiringApproval: collectionsCopy,
        }
      }),
  })),
  shallow
)
