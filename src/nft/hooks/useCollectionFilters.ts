import { NftAssetSortableField } from 'graphql/data/nft/__generated__/AssetPaginationQuery.graphql'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

export enum SortBy {
  LowToHigh,
  HighToLow,
  RareToCommon,
  CommonToRare,
}

export const SortByPointers = {
  [SortBy.HighToLow]: 'highest',
  [SortBy.LowToHigh]: 'lowest',
  [SortBy.RareToCommon]: 'rare',
  [SortBy.CommonToRare]: 'common',
}
interface QueryInfo {
  field: NftAssetSortableField
  asc: boolean
}
export const SortByQueries = {
  [SortBy.HighToLow]: { field: 'PRICE', asc: false } as QueryInfo,
  [SortBy.LowToHigh]: { field: 'PRICE', asc: true } as QueryInfo,
  [SortBy.RareToCommon]: { field: 'RARITY', asc: true } as QueryInfo,
  [SortBy.CommonToRare]: { field: 'RARITY', asc: false } as QueryInfo,
}

export type Trait = {
  trait_type: string
  trait_value: string
  trait_count?: number
  floorPrice?: number
}

interface State {
  traits: Trait[]
  hasRarity: boolean
  markets: string[]
  minPrice: string
  maxPrice: string
  minRarity: number | ''
  maxRarity: number | ''
  marketCount: Record<string, number>
  buyNow: boolean
  search: string
  sortBy: SortBy
  showFullTraitName: { shouldShow: boolean; trait_value?: string; trait_type: string }
}

type Actions = {
  setHasRarity: (hasRarity: boolean) => void
  setMarketCount: (_: Record<string, number>) => void
  addMarket: (market: string) => void
  removeMarket: (market: string) => void
  addTrait: (trait: Trait) => void
  removeTrait: (trait: Trait) => void
  reset: () => void
  setMinPrice: (price: string) => void
  setMaxPrice: (price: string) => void
  setMinRarity: (range: number | '') => void
  setMaxRarity: (range: number | '') => void
  setBuyNow: (bool: boolean) => void
  setSearch: (term: string) => void
  setSortBy: (sortBy: SortBy) => void
  toggleShowFullTraitName: (show: { shouldShow: boolean; trait_value: string; trait_type: string }) => void
}

export type CollectionFilters = State & Actions

export const initialCollectionFilterState: State = {
  minPrice: '',
  maxPrice: '',
  minRarity: '',
  maxRarity: '',
  traits: [],
  hasRarity: false,
  markets: [],
  marketCount: {},
  buyNow: false,
  search: '',
  sortBy: SortBy.LowToHigh,
  showFullTraitName: { shouldShow: false, trait_value: '', trait_type: '' },
}

export const useCollectionFilters = create<CollectionFilters>()(
  devtools(
    (set) => ({
      ...initialCollectionFilterState,
      setHasRarity: (hasRarity) => set({ hasRarity }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSearch: (search) => set({ search }),
      setBuyNow: (buyNow) => set({ buyNow }),
      setMarketCount: (marketCount) => set({ marketCount }),
      addMarket: (market) => set(({ markets }) => ({ markets: [...markets, market] })),
      removeMarket: (market) => set(({ markets }) => ({ markets: markets.filter((_market) => market !== _market) })),
      addTrait: (trait) => set(({ traits }) => ({ traits: [...traits, trait] })),
      removeTrait: (trait) =>
        set(({ traits }) => ({
          traits: traits.filter((x) => JSON.stringify(x) !== JSON.stringify(trait)),
        })),
      reset: () => set(() => ({ traits: [], minRarity: '', maxRarity: '', markets: [], minPrice: '', maxPrice: '' })),
      setMinPrice: (price) => set(() => ({ minPrice: price })),
      setMaxPrice: (price) => set(() => ({ maxPrice: price })),
      setMinRarity: (range) => set(() => ({ minRarity: range })),
      setMaxRarity: (range) => set(() => ({ maxRarity: range })),
      toggleShowFullTraitName: ({ shouldShow, trait_value, trait_type }) =>
        set(() => ({ showFullTraitName: { shouldShow, trait_value, trait_type } })),
    }),
    { name: 'useCollectionTraits' }
  )
)
