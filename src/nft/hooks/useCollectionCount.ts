import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface State {
  collectionCount: number
  setCollectionCount: (collectionCount: number) => void
}

export const useCollectionCount = create<State>()(
  persist(
    devtools(
      (set) => ({
        collectionCount: 0,
        setCollectionCount: (collectionCount) => set({ collectionCount }),
      }),
      { name: 'useCollectionCount' }
    ),
    { name: 'useCollectionCount' }
  )
)
