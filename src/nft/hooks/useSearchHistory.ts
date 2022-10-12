import { FungibleToken, GenieCollection } from 'nft/types'
import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SearchHistoryProps {
  history: (FungibleToken | GenieCollection)[]
  addItem: (item: FungibleToken | GenieCollection) => void
  updateItem: (update: FungibleToken | GenieCollection) => void
}

export const useSearchHistory = create<SearchHistoryProps>()(
  persist(
    devtools((set) => ({
      history: [],
      addItem: (item: FungibleToken | GenieCollection) => {
        set(({ history }) => {
          const historyCopy = [...history]
          if (historyCopy.length === 0 || historyCopy[0].address !== item.address) historyCopy.unshift(item)
          return { history: historyCopy }
        })
      },
      updateItem: (update: FungibleToken | GenieCollection) => {
        set(({ history }) => {
          const index = history.findIndex((item) => item.address === update.address)
          if (index === -1) return { history }

          const historyCopy = [...history]
          historyCopy[index] = update
          return { history: historyCopy }
        })
      },
    })),
    { name: 'useSearchHistory' }
  )
)
