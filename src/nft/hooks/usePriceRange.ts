import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SearchHistoryProps {
  priceRangeLow: string
  setPriceRangeLow: (priceRangeLow: string) => void
  priceRangeHigh: string
  setPriceRangeHigh: (priceRangeHigh: string) => void
  prevMinMax: Array<number>
  setPrevMinMax: (prevMinMax: Array<number>) => void
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
      prevMinMax: [0, 100],
      setPrevMinMax: (prevMinMax: Array<number>) => {
        set(() => {
          return { prevMinMax }
        })
      },
    })),
    { name: 'usePriceRange' }
  )
)
