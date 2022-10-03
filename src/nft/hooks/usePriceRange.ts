import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SearchHistoryProps {
  priceRangeLow: string
  setPriceRangeLow: (priceRangeLow: string) => void
  priceRangeHigh: string
  setPriceRangeHigh: (priceRangeHigh: string) => void
}

export const usePriceRange = create<SearchHistoryProps>()(
  persist(
    devtools((set) => ({
      priceRangeLow: '',
      setPriceRangeLow: (priceRangeLow: string) => {
        set(() => {
          return { priceRangeLow }
        })
      },
      priceRangeHigh: '',
      setPriceRangeHigh: (priceRangeHigh: string) => {
        set(() => {
          return { priceRangeHigh }
        })
      },
    })),
    { name: 'usePriceRange' }
  )
)
