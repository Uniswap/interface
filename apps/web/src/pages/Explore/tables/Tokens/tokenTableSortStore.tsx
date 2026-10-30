import { isDevEnv } from '@universe/environment'
import { createContext, useContext, useState } from 'react'
import type { TokenCategoryDefaultSort } from 'uniswap/src/features/tokenCategories/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { tokenSortMethodToOrderBy } from '~/features/Explore/state/listTokens/utils/topTokensOrderByMappings'

interface TokenTableSort {
  sortMethod: TokenSortMethod
  sortAscending: boolean
}

interface TokenTableSortState extends TokenTableSort {
  actions: {
    setSort: (category: TokenSortMethod) => boolean
  }
}

type TokenTableSortStore = UseBoundStore<StoreApi<TokenTableSortState>>

const DEFAULT_TOKEN_TABLE_SORT: TokenTableSort = { sortMethod: TokenSortMethod.VOLUME, sortAscending: false }

export function getTokenTableSort(defaultSort: TokenCategoryDefaultSort | undefined): TokenTableSort {
  if (!defaultSort) {
    return DEFAULT_TOKEN_TABLE_SORT
  }
  const sortMethod = Object.values(TokenSortMethod).find(
    (method) => tokenSortMethodToOrderBy[method] === defaultSort.orderBy,
  )
  return sortMethod ? { sortMethod, sortAscending: defaultSort.ascending } : DEFAULT_TOKEN_TABLE_SORT
}

export function createTokenTableSortStore(initialSort: TokenTableSort = DEFAULT_TOKEN_TABLE_SORT): TokenTableSortStore {
  return create<TokenTableSortState>()(
    devtools(
      (set) => ({
        ...initialSort,
        actions: {
          setSort: (category) => {
            let newSortAscending = false
            set((state) => {
              newSortAscending = state.sortMethod === category ? !state.sortAscending : false
              return { sortMethod: category, sortAscending: newSortAscending }
            })
            return newSortAscending
          },
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

export function TokenTableSortStoreContextProvider({
  children,
  initialSort,
}: {
  children: React.ReactNode
  initialSort?: TokenTableSort
}): JSX.Element {
  const [store] = useState(() => createTokenTableSortStore(initialSort))

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
