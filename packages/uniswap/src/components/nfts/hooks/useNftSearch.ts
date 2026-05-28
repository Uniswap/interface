import { useMemo, useState } from 'react'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { buildNftsArray, filterNft } from 'uniswap/src/features/nfts/utils'

interface UseNftSearchParams {
  shownNfts: NFTItem[]
  hiddenNfts: NFTItem[]
  hiddenNftsExpanded: boolean
  hasNextPage: boolean
}

interface UseNftSearchResult {
  search: string
  setSearch: (value: string) => void
  filteredShownNfts: NFTItem[]
  filteredHiddenNfts: NFTItem[]
  nfts: Array<NFTItem | string>
  filteredShownCount: number
  filteredHiddenCount: number
}

export function useNftSearch({
  shownNfts,
  hiddenNfts,
  hiddenNftsExpanded,
  hasNextPage,
}: UseNftSearchParams): UseNftSearchResult {
  const [search, setSearch] = useState('')

  const filteredShownNfts = useMemo(() => {
    if (!search) {
      return shownNfts
    }
    return shownNfts.filter((item) => filterNft(item, search))
  }, [shownNfts, search])

  const filteredHiddenNfts = useMemo(() => {
    if (!search) {
      return hiddenNfts
    }
    return hiddenNfts.filter((item) => filterNft(item, search))
  }, [hiddenNfts, search])

  const nfts = useMemo<Array<NFTItem | string>>(
    () =>
      buildNftsArray({
        shownNfts: filteredShownNfts,
        hiddenNfts: filteredHiddenNfts,
        showHidden: hiddenNftsExpanded,
        allPagesFetched: !hasNextPage,
      }),
    [filteredShownNfts, filteredHiddenNfts, hiddenNftsExpanded, hasNextPage],
  )

  return {
    search,
    setSearch,
    filteredShownNfts,
    filteredHiddenNfts,
    nfts,
    filteredShownCount: filteredShownNfts.length,
    filteredHiddenCount: filteredHiddenNfts.length,
  }
}
