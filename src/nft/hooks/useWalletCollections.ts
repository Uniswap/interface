import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { WalletAsset, WalletCollection } from '../types'

interface WalletCollectionState {
  walletAssets: WalletAsset[]
  walletCollections: WalletCollection[]
  displayAssets: WalletAsset[]
  collectionFilters: string[]
  listFilter: string
  setWalletAssets: (assets: WalletAsset[]) => void
  setWalletCollections: (collections: WalletCollection[]) => void
  setCollectionFilters: (address: string) => void
  clearCollectionFilters: () => void
  setListFilter: (value: string) => void
  setDisplayAssets: (walletAssets: WalletAsset[], listFilter: string) => void
}

export const useWalletCollections = create<WalletCollectionState>()(
  devtools(
    (set) => ({
      walletAssets: [],
      walletCollections: [],
      displayAssets: [],
      collectionFilters: [],
      listFilter: 'All',
      setWalletAssets: (assets) =>
        set(() => {
          return {
            walletAssets: assets?.filter((asset) => asset.asset_contract?.schema_name === 'ERC721'),
          }
        }),
      setWalletCollections: (collections) =>
        set(() => {
          return { walletCollections: collections }
        }),
      setCollectionFilters: (address) =>
        set(({ collectionFilters }) => {
          if (collectionFilters.length === 0) return { collectionFilters: [address] }
          else if (!!collectionFilters.find((x) => x === address))
            return { collectionFilters: collectionFilters.filter((n) => n !== address) }
          else return { collectionFilters: [...collectionFilters, address] }
        }),
      clearCollectionFilters: () =>
        set(() => {
          return { collectionFilters: [] }
        }),
      setListFilter: (value) =>
        set(() => {
          return { listFilter: value }
        }),
      setDisplayAssets: (walletAssets, listFilter) =>
        set(() => {
          return { displayAssets: filterWalletAssets(walletAssets, listFilter) }
        }),
    }),
    { name: 'useWalletCollections' }
  )
)

const filterWalletAssets = (walletAssets: WalletAsset[], listFilter: string) => {
  let displayAssets = walletAssets
  if (listFilter === 'Listed')
    displayAssets = displayAssets?.filter((x) => {
      return x.listing_date !== null
    })
  if (listFilter === 'Unlisted')
    displayAssets = displayAssets?.filter((x) => {
      return x.listing_date === null
    })
  return displayAssets
}
