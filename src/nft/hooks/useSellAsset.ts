import { v4 as uuidv4 } from 'uuid'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { ListingMarket, ListingWarning, WalletAsset } from '../types'

interface SellAssetState {
  sellAssets: WalletAsset[]
  selectSellAsset: (asset: WalletAsset) => void
  removeSellAsset: (asset: WalletAsset) => void
  reset: () => void
  setGlobalExpiration: (expirationTime: number) => void
  setAssetListPrice: (asset: WalletAsset, price?: number, marketplace?: ListingMarket) => void
  setGlobalMarketplaces: (marketplaces: ListingMarket[]) => void
  removeAssetMarketplace: (asset: WalletAsset, marketplace: ListingMarket) => void
  addMarketplaceWarning: (asset: WalletAsset, warning: ListingWarning) => void
  removeMarketplaceWarning: (asset: WalletAsset, warning: ListingWarning, setGlobalOverride?: boolean) => void
  removeAllMarketplaceWarnings: () => void
}

export const useSellAsset = create<SellAssetState>()(
  devtools(
    (set) => ({
      sellAssets: [],
      selectSellAsset: (asset) =>
        set(({ sellAssets }) => {
          const assetWithId = { id: uuidv4(), ...asset }
          if (sellAssets.length === 0) return { sellAssets: [assetWithId] }
          else return { sellAssets: [...sellAssets, assetWithId] }
        }),
      removeSellAsset: (asset) => {
        set(({ sellAssets }) => {
          if (sellAssets.length === 0) return { sellAssets: [] }
          else sellAssets.find((x) => x.id === asset.id)
          const assetsCopy = [...sellAssets]
          assetsCopy.splice(
            sellAssets.findIndex((n) => n.id === asset.id),
            1
          )
          return { sellAssets: assetsCopy }
        })
      },
      reset: () => set(() => ({ sellAssets: [] })),
      setGlobalExpiration: (expirationTime) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          assetsCopy.map((asset) => {
            asset.expirationTime = expirationTime
            return asset
          })
          return { sellAssets: assetsCopy }
        })
      },
      setAssetListPrice: (asset, price, marketplace?) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          if (marketplace) {
            const listingIndex = asset.newListings?.findIndex(
              (listing) => listing.marketplace.name === marketplace.name
            )
            if (asset.newListings && listingIndex != null && listingIndex > -1) {
              asset.newListings[listingIndex] = { price, marketplace, overrideFloorPrice: false }
              if (listingIndex === 0) asset.marketAgnosticPrice = price
            } else asset.newListings?.push({ price, marketplace, overrideFloorPrice: false })
          } else asset.marketAgnosticPrice = price
          const index = sellAssets.findIndex((n) => n.id === asset.id)
          assetsCopy[index] = asset
          return { sellAssets: assetsCopy }
        })
      },
      setGlobalMarketplaces: (marketplaces) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          assetsCopy.map((asset) => {
            asset.marketplaces = marketplaces
            asset.newListings = []
            for (const marketplace of marketplaces) {
              const listingIndex = asset.newListings.findIndex(
                (listing) => listing.marketplace.name === marketplace.name
              )
              const newListing = {
                price: asset.marketAgnosticPrice,
                marketplace,
                overrideFloorPrice: false,
              }
              listingIndex > -1 ? (asset.newListings[listingIndex] = newListing) : asset.newListings.push(newListing)
            }
            return asset
          })
          return { sellAssets: assetsCopy }
        })
      },
      removeAssetMarketplace: (asset, marketplace) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          const assetIndex = sellAssets.indexOf(asset)
          const marketplaceIndex =
            asset.marketplaces?.findIndex((oldMarket) => oldMarket.name === marketplace.name) ?? -1
          const listingIndex = asset.newListings?.findIndex((listing) => listing.marketplace.name === marketplace.name)
          const assetCopy = JSON.parse(JSON.stringify(asset))
          if (marketplaceIndex > -1) {
            assetCopy.marketplaces.splice(marketplaceIndex, 1)
            assetCopy.newListings.splice(listingIndex, 1)
          }
          assetsCopy.splice(assetIndex, 1, assetCopy)
          return { sellAssets: assetsCopy }
        })
      },
      addMarketplaceWarning: (asset, warning) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          asset.listingWarnings?.push(warning)
          const index = sellAssets.findIndex((n) => n.id === asset.id)
          assetsCopy[index] = asset
          return { sellAssets: assetsCopy }
        })
      },
      removeMarketplaceWarning: (asset, warning, setGlobalOverride?) => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          if (asset.listingWarnings === undefined || asset.newListings === undefined) return { sellAssets: assetsCopy }
          const warningIndex =
            asset.listingWarnings?.findIndex((n) => n.marketplace.name === warning.marketplace.name) ?? -1
          asset.listingWarnings?.splice(warningIndex, 1)
          if (warning?.message?.includes('LISTING BELOW FLOOR')) {
            if (setGlobalOverride) {
              asset.newListings?.forEach((listing) => (listing.overrideFloorPrice = true))
            } else {
              const listingIndex =
                asset.newListings?.findIndex((n) => n.marketplace.name === warning.marketplace.name) ?? -1
              asset.newListings[listingIndex].overrideFloorPrice = true
            }
          }
          const index = sellAssets.findIndex((n) => n.id === asset.id)
          assetsCopy[index] = asset
          return { sellAssets: assetsCopy }
        })
      },
      removeAllMarketplaceWarnings: () => {
        set(({ sellAssets }) => {
          const assetsCopy = [...sellAssets]
          assetsCopy.map((asset) => (asset.listingWarnings = []))
          return { sellAssets: assetsCopy }
        })
      },
    }),
    { name: 'useSelectAsset' }
  )
)
