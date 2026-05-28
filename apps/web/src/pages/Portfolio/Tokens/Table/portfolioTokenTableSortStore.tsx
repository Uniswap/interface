import { isDevEnv } from '@universe/environment'
import { createContext, useContext, useState } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

export enum PortfolioTokenSortMethod {
  VALUE = 'Value',
  PRICE = 'Price',
  CHANGE_1D = '1 day',
  BALANCE = 'Balance',
  ALLOCATION = 'Allocation',
  AVG_COST = 'Avg Cost',
  UNREALIZED_PNL = 'Unrealized PnL',
}

interface PortfolioTokenTableSortState {
  sortMethod: PortfolioTokenSortMethod
  sortAscending: boolean
  actions: {
    setSort: (category: PortfolioTokenSortMethod) => void
  }
}

type PortfolioTokenTableSortStore = UseBoundStore<StoreApi<PortfolioTokenTableSortState>>

const INITIAL_SORT_METHOD = PortfolioTokenSortMethod.VALUE
const INITIAL_SORT_ASCENDING = false

export function createPortfolioTokenTableSortStore(): PortfolioTokenTableSortStore {
  return create<PortfolioTokenTableSortState>()(
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
        name: 'usePortfolioTokenTableSortStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}

const PortfolioTokenTableSortStoreContext = createContext<PortfolioTokenTableSortStore | null>(null)
// no sort on Portfolio Overview mini table
const portfolioTokenTableSortStoreFallback = createPortfolioTokenTableSortStore()

export function PortfolioTokenTableSortStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [store] = useState(() => createPortfolioTokenTableSortStore())

  return (
    <PortfolioTokenTableSortStoreContext.Provider value={store}>
      {children}
    </PortfolioTokenTableSortStoreContext.Provider>
  )
}

function usePortfolioTokenTableSortStoreBase(): PortfolioTokenTableSortStore {
  const store = useContext(PortfolioTokenTableSortStoreContext)
  return store ?? portfolioTokenTableSortStoreFallback
}

export function usePortfolioTokenTableSortStore<T>(
  selector: (state: Omit<PortfolioTokenTableSortState, 'actions'>) => T,
): T {
  const store = usePortfolioTokenTableSortStoreBase()
  return useStore(store, useShallow(selector))
}

export function usePortfolioTokenTableSortStoreActions(): PortfolioTokenTableSortState['actions'] {
  const store = usePortfolioTokenTableSortStoreBase()
  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
