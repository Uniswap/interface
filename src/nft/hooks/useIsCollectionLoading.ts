import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  isCollectionLoading: boolean
  setIsCollectionLoading: (isCollectionLoading: boolean) => void
}

export const useIsCollectionLoading = create<State>()(
  devtools(
    (set) => ({
      isCollectionLoading: false,
      setIsCollectionLoading: (isCollectionLoading) =>
        set(() => {
          return { isCollectionLoading }
        }),
    }),
    { name: 'useIsCollectionLoading' }
  )
)
