import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SearchHistoryProps {
  priceLow: string
  setPriceLow: (priceLow: string) => void
  priceHigh: string
  setPriceHigh: (priceLow: string) => void
}

export const usePriceRange = create<SearchHistoryProps>()(
  persist(
    devtools((set) => ({
      priceLow: '',
      setPriceLow: (priceLow: string) => {
        set(() => {
          return { priceLow }
        })
      },
      priceHigh: '',
      setPriceHigh: (priceHigh: string) => {
        set(() => {
          return { priceHigh }
        })
      },
    })),
    { name: 'usePriceRange' }
  )
)
