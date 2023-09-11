import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { ListingMarket, WalletAsset } from '../types'

interface SellAssetState {
  sellAssets: WalletAsset[]
  issues: number
  showResolveIssues: boolean
  selectSellAsset: (asset: WalletAsset) => void
  removeSellAsset: (asset: WalletAsset) => void
  reset: () => void
  setGlobalExpiration: (expirationTime: number) => void
  setAssetListPrice: (asset: WalletAsset, price?: number, marketplace?: ListingMarket) => void
  setGlobalMarketplaces: (marketplaces: ListingMarket[]) => void
  removeAssetMarketplace: (asset: WalletAsset, marketplace: ListingMarket) => void
  toggleShowResolveIssues: () => void
  setIssues: (issues: number) => void
}

export const useSellAsset = create<SellAssetState>()(
  devtools(
    (set) => ({
      sellAssets: [],
      issues: 0,
      showResolveIssues: false,
      selectSellAsset: (asset) =>
        set(({ sellAssets }) => {
          if (sellAssets.length === 0) return { sellAssets: [asset] }
          else return { sellAssets: [...sellAssets, asset] }
        }),
      removeSellAsset: (asset) => {
        set(({ sellAssets }) => {
          if (sellAssets.length === 0) return { sellAssets: [] }
          else
            sellAssets.find(
              (x) => asset.tokenId === x.tokenId && x.asset_contract.address === asset.asset_contract.address
            )
          const assetsCopy = [...sellAssets]
          assetsCopy.splice(
            sellAssets.findIndex(
              (n) => n.tokenId === asset.tokenId && n.asset_contract.address === asset.asset_contract.address
            ),
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
          const index = sellAssets.findIndex(
            (n) => n.tokenId === asset.tokenId && n.asset_contract.address === asset.asset_contract.address
          )
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
      toggleShowResolveIssues: () => {
        set(({ showResolveIssues }) => {
          return { showResolveIssues: !showResolveIssues }
        })
      },
      setIssues: (issues) =>
        set(() => ({
          issues,
        })),
    }),
    { name: 'useSelectAsset' }
  )
)
