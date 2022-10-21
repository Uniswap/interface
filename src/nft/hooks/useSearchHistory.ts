import { SearchedToken } from 'graphql/data/TokenSearch'
import { TopToken } from 'graphql/data/TopTokens'
import { GenieCollection } from 'nft/types'
import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SearchHistoryProps {
  history: (NonNullable<SearchedToken> | NonNullable<TopToken> | GenieCollection)[]
  addItem: (item: NonNullable<SearchedToken> | GenieCollection | NonNullable<TopToken>) => void
  updateItem: (update: NonNullable<SearchedToken> | GenieCollection | NonNullable<TopToken>) => void
}

export const useSearchHistory = create<SearchHistoryProps>()(
  persist(
    devtools((set) => ({
      history: [],
      addItem: (item: NonNullable<SearchedToken> | GenieCollection | NonNullable<TopToken>) => {
        set(({ history }) => {
          const historyCopy = [...history]
          if (historyCopy.length === 0 || historyCopy[0].address !== item.address) historyCopy.unshift(item)
          return { history: historyCopy }
        })
      },
      updateItem: (update: NonNullable<SearchedToken> | GenieCollection | NonNullable<TopToken>) => {
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
