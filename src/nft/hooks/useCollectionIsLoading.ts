import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  isCollectionLoading: boolean
  setCollectionIsLoading: (isLoading: boolean) => void
}

export const useCollectionIsLoading = create<State>()(
  devtools(
    (set) => ({
      isCollectionLoading: false,
      setCollectionIsLoading: (isCollectionLoading) =>
        set(() => {
          return { isCollectionLoading }
        }),
    }),
    { name: 'useCollectionIsLoading' }
  )
)
