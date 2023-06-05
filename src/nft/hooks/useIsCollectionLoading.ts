import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  isCollectionNftsLoading: boolean
  setIsCollectionNftsLoading: (isCollectionNftsLoading: boolean) => void
  isCollectionStatsLoading: boolean
  setIsCollectionStatsLoading: (isCollectionStatsLoading: boolean) => void
}

export const useIsCollectionLoading = create<State>()(
  devtools(
    (set) => ({
      isCollectionNftsLoading: false,
      setIsCollectionNftsLoading: (isCollectionNftsLoading) =>
        set(() => {
          return { isCollectionNftsLoading }
        }),
      isCollectionStatsLoading: false,
      setIsCollectionStatsLoading: (isCollectionStatsLoading) =>
        set(() => {
          return { isCollectionStatsLoading }
        }),
    }),
    { name: 'useIsCollectionLoading' }
  )
)
