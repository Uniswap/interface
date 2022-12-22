import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export enum SearchHistoryType {
  FungibleToken = 'FungibleToken',
  GenieCollection = 'GenieCollection',
}

export type SearchHistoryItem = {
  address: string
  type: SearchHistoryType
  name: string
}

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  addItem: (item: SearchHistoryItem) => void
}

export const useSearchHistory = create<SearchHistoryProps>()(
  persist(
    devtools((set) => ({
      history: [],
      addItem: (item: SearchHistoryItem) => {
        set(({ history }) => {
          const historyCopy = [...history]
          if (historyCopy.length === 0 || historyCopy[0].address !== item.address) historyCopy.unshift(item)
          return { history: historyCopy }
        })
      },
    })),
    { name: 'useSearchHistory' }
  )
)
