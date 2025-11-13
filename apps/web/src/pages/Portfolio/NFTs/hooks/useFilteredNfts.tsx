import { filterNft } from 'pages/Portfolio/NFTs/utils/filterNfts'
import { useMemo } from 'react'
import { NFTItem } from 'uniswap/src/features/nfts/types'

function filterNftsBySearch(nfts: NFTItem[], search: string): NFTItem[] {
  if (!search) {
    return nfts
  }

  const lowercaseSearch = search.trim().toLowerCase()

  return nfts.filter((item) => filterNft(item, lowercaseSearch))
}

export function useFilteredNfts({ nfts, search }: { nfts: NFTItem[]; search: string }): {
  nfts: NFTItem[]
  count: number
} {
  return useMemo(() => {
    const filtered = filterNftsBySearch(nfts, search)
    return {
      nfts: filtered,
      count: filtered.length,
    }
  }, [nfts, search])
}
