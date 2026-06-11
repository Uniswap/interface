import { isDevEnv } from '@universe/environment'
import { createContext, useContext, useState } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { OrderDirection } from '~/appGraphql/data/util'

export enum StocksSortMethod {
  PRICE = 'Price',
  VOLUME = 'Volume',
  HOUR_CHANGE = '1 hour',
  DAY_CHANGE = '1 day',
  MARKET_CAP = 'Market cap',
}

interface StocksTableSortState {
  sortMethod: StocksSortMethod
  sortAscending: boolean
  actions: {
    setSort: (method: StocksSortMethod) => void
  }
}

type StocksTableSortStore = UseBoundStore<StoreApi<StocksTableSortState>>

const INITIAL_SORT_METHOD = StocksSortMethod.VOLUME
const INITIAL_SORT_ASCENDING = false

export function createStocksTableSortStore(): StocksTableSortStore {
  return create<StocksTableSortState>()(
    devtools(
      (set) => ({
        sortMethod: INITIAL_SORT_METHOD,
        sortAscending: INITIAL_SORT_ASCENDING,
        actions: {
          setSort: (method) =>
            set((state) => {
              if (state.sortMethod === method) {
                return { sortAscending: !state.sortAscending }
              }
              return { sortMethod: method, sortAscending: false }
            }),
        },
      }),
      {
        name: 'useStocksTableSortStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}

const StocksTableSortStoreContext = createContext<StocksTableSortStore | null>(null)

export function StocksTableSortStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [store] = useState(() => createStocksTableSortStore())

  return <StocksTableSortStoreContext.Provider value={store}>{children}</StocksTableSortStoreContext.Provider>
}

function useStocksTableSortStoreBase(): StocksTableSortStore {
  const store = useContext(StocksTableSortStoreContext)

  if (!store) {
    throw new Error('useStocksTableSortStore must be used within StocksTableSortStoreContextProvider')
  }

  return store
}

export function useStocksTableSortStore<T>(selector: (state: Omit<StocksTableSortState, 'actions'>) => T): T {
  const store = useStocksTableSortStoreBase()
  return useStore(store, useShallow(selector))
}

export function useStocksTableSortStoreActions(): StocksTableSortState['actions'] {
  const store = useStocksTableSortStoreBase()
  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}

export function useStocksTableSortSelection(): {
  sortMethod: StocksSortMethod
  sortAscending: boolean
  orderDirection: OrderDirection
} {
  const { sortMethod, sortAscending } = useStocksTableSortStore((state) => ({
    sortMethod: state.sortMethod,
    sortAscending: state.sortAscending,
  }))

  return {
    sortMethod,
    sortAscending,
    orderDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
  }
}
