import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { OpenSeaAsset, OpenSeaCollection } from '../types'

type NFTListState = {
  /**
   * NFTs with filters
   */
  NFTs: OpenSeaAsset[]
  /**
   * all NFTs fetched from OpenSea
   */
  allNFTs: OpenSeaAsset[]
  fill: (initial: OpenSeaAsset[]) => void
  filterByName: (name: string) => void
  filterByCollection: (collection: OpenSeaCollection | null) => void
}

export const useNFTList = create<NFTListState>()(
  devtools(
    (set) => ({
      allNFTs: [],
      NFTs: [],
      fill: (initialNFTs) => set(() => ({ NFTs: initialNFTs, allNFTs: initialNFTs })),
      filterByCollection: (collection) =>
        set(({ allNFTs }) => {
          const found = collection == null ? allNFTs : allNFTs.filter((x) => x.collection?.slug === collection.slug)

          return { NFTs: found }
        }),
      filterByName: (name) =>
        set(({ allNFTs, NFTs }) => {
          if (name === '') return { NFTs: allNFTs }
          const found = NFTs.filter((x) => {
            const lc = name.toLowerCase()

            const query = [x.name, x.collection?.name].map((x) => (x === null ? '' : x?.toLowerCase())).join('')

            return query.includes(lc)
          })

          return { NFTs: found }
        }),
    }),
    { name: 'useNFTList' }
  )
)
