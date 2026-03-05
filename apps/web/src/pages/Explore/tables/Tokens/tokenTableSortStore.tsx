import { createContext, useContext, useState } from 'react'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { TokenSortMethod } from '~/components/Tokens/constants'

interface TokenTableSortState {
  sortMethod: TokenSortMethod
  sortAscending: boolean
  actions: {
    setSort: (category: TokenSortMethod) => void
  }
}

type TokenTableSortStore = UseBoundStore<StoreApi<TokenTableSortState>>

const INITIAL_SORT_METHOD = TokenSortMethod.VOLUME
const INITIAL_SORT_ASCENDING = false

export function createTokenTableSortStore(): TokenTableSortStore {
  return create<TokenTableSortState>()(
    devtools(
      (set) => ({
        sortMethod: INITIAL_SORT_METHOD,
        sortAscending: INITIAL_SORT_ASCENDING,
        actions: {
          setSort: (category) =>
            set((state) => {
              if (state.sortMethod === category) {
                return { sortAscending: !state.sortAscending }
              }
              return { sortMethod: category, sortAscending: false }
            }),
        },
      }),
      {
        name: 'useTokenTableSortStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}

const TokenTableSortStoreContext = createContext<TokenTableSortStore | null>(null)

export function TokenTableSortStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [store] = useState(() => createTokenTableSortStore())

  return <TokenTableSortStoreContext.Provider value={store}>{children}</TokenTableSortStoreContext.Provider>
}

function useTokenTableSortStoreBase(): TokenTableSortStore {
  const store = useContext(TokenTableSortStoreContext)

  if (!store) {
    throw new Error('useTokenTableSortStore must be used within TokenTableSortStoreContextProvider')
  }

  return store
}

export function useTokenTableSortStore<T>(selector: (state: Omit<TokenTableSortState, 'actions'>) => T): T {
  const store = useTokenTableSortStoreBase()
  return useStore(store, useShallow(selector))
}

export function useTokenTableSortStoreActions(): TokenTableSortState['actions'] {
  const store = useTokenTableSortStoreBase()
  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
