import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { OpenSeaAsset } from '../types'

interface SelectNFTState {
  /**
   * NFTs selected by a user
   */
  selectedNFTs: (OpenSeaAsset & { price?: number })[]

  selectNFT: (nft: OpenSeaAsset & { price?: number }) => void
  reset: () => void
  setUniversalPrice: (price: number) => void
  toggleUniversalPrice: (v: boolean) => void
  setSingleNFTPrice: (id: number, price: number) => void
  isUniversalPrice: boolean
}

export const useNFTSelect = create<SelectNFTState>()(
  devtools(
    (set) => ({
      selectedNFTs: [],
      isUniversalPrice: false,
      selectNFT: (nft) =>
        set(({ selectedNFTs }) => {
          if (selectedNFTs.length === 0) return { selectedNFTs: [nft] }
          else if (selectedNFTs.some((x) => x.id === nft.id))
            return { selectedNFTs: selectedNFTs.filter((n) => n.id !== nft.id) }
          else return { selectedNFTs: [...selectedNFTs, nft] }
        }),
      reset: () => set(() => ({ selectedNFTs: [] })),
      toggleUniversalPrice: (v) => set(() => ({ isUniversalPrice: v })),
      setUniversalPrice: (price) =>
        set(({ selectedNFTs }) => {
          return {
            selectedNFTs: selectedNFTs.map((n) => ({ ...n, price })),
            isUniversalPrice: true,
          }
        }),
      setSingleNFTPrice: (id, price) =>
        set(({ selectedNFTs }) => {
          const found = selectedNFTs.find((i) => i.id === id)

          return {
            selectedNFTs: [...selectedNFTs.filter((n) => n.id !== id), { ...found, price }],
          }
        }),
    }),
    { name: 'useNFTSelect' }
  )
)
