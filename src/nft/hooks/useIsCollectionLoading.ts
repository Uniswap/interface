import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  isCollectionLoading: boolean
  setIsCollectionLoading: (isCollectionLoading: boolean) => void
  isCollectionStatsLoading: boolean
  setIsCollectionStatsLoading: (isCollectionLoading: boolean) => void
}

export const useIsCollectionLoading = create<State>()(
  devtools(
    (set) => ({
      isCollectionLoading: false,
      setIsCollectionLoading: (isCollectionLoading) =>
        set(() => {
          return { isCollectionLoading }
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
