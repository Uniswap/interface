/* eslint-disable react-hooks/exhaustive-deps */
import { Trait, SortBy, useCollectionFilters } from '../../hooks/useCollectionFilters'
import { Box, BoxProps } from '../../components/Box'
import { FormEvent, useEffect, useState } from 'react'
import { GenieAsset, GenieCollection, TxResponse, TxStateType, UniformHeight } from '../../types'
import useDebouncedCallback from '../../../hooks/useDebounce'

interface CollectionProps {
  setFiltersExpanded: (state: boolean) => void
  reset: () => void
  isFiltersExpanded: boolean
  collectionStats: GenieCollection
  collectionNfts: GenieAsset[]
  fetchNextPage: () => void
  debouncedSearchByName: (v: string) => void
  searchByNameText: string
  removeTrait: (trait: Trait) => void
  traits: Trait[]
  hasFilters?: boolean
  hasNextPage: boolean
  isMobile: boolean
  cartExpanded: boolean
  loading: boolean
  isSweeping: boolean
  setSweeping: (state: boolean) => void
  contractAddress: any
  isReviewingSweep: boolean
  setReviewingSweep: (state: boolean) => void
  txState: TxStateType
  txResponse: TxResponse
  setTxResponse: (state: TxResponse) => void
  hasRarity: boolean
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
  markets: string[]
  removeMarket: (market: string) => void
  uniformHeight: number
  setUniformHeight: (uniformHeight: UniformHeight | number) => void
  isActivityToggled: boolean
  toggleActivity: () => void
}

export const CollectionSearch = () => {
  const [debouncedSearchByNameText, setDebouncedSearchByNameText] = useState('')

  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)
  // const debouncedSearchByName = useDebouncedCallback<[string]>(
  //   // function
  //   (value) => {
  //     setSearchByNameText(value)
  //   },
  //   // delay in ms
  //   1000
  // )

  return (
    <Box
      as="input"
      borderColor={{ default: 'medGray', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="12"
      padding="12"
      backgroundColor="white"
      fontSize="16"
      height="44"
      color={{ placeholder: 'darkGray', default: 'blackBlue' }}
      value={debouncedSearchByNameText}
      placeholder={'Search by name'}
      onChange={(e: FormEvent<HTMLInputElement>) => {
        setDebouncedSearchByNameText(e.currentTarget.value)
        setSearchByNameText(e.currentTarget.value)
      }}
    />
  )
}
