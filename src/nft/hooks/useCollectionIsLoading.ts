import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  collectionIsLoading: boolean
  setCollectionIsLoading: (isLoading: boolean) => void
}

export const useCollectionIsLoading = create<State>()(
  devtools(
    (set) => ({
      collectionIsLoading: false,
      setCollectionIsLoading: (collectionIsLoading) =>
        set(() => {
          return { collectionIsLoading }
        }),
    }),
    { name: 'useCollectionIsLoading' }
  )
)
