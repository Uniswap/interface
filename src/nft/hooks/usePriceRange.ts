import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface PriceRangeProps {
  priceRangeLow: string
  setPriceRangeLow: (priceRangeLow: string) => void
  priceRangeHigh: string
  setPriceRangeHigh: (priceRangeHigh: string) => void
  prevMinMax: Array<number>
  setPrevMinMax: (prevMinMax: Array<number>) => void
}

export const usePriceRange = create<PriceRangeProps>()(
  devtools(
    (set) => ({
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
    }),
    { name: 'usePriceRange' }
  )
)
