import { createContext, useContext, useState } from 'react'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'

interface PoolTableActions {
  setSort: (category: PoolSortFields) => void
  resetSort: () => void
}

interface PoolTableState {
  sortMethod: PoolSortFields
  sortAscending: boolean
  actions: PoolTableActions
}

type PoolTableStore = UseBoundStore<StoreApi<PoolTableState>>

const INITIAL_SORT_METHOD = PoolSortFields.TVL
const INITIAL_SORT_ASCENDING = false

export function createPoolTableStore(): PoolTableStore {
  return create<PoolTableState>()(
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
          resetSort: () =>
            set({
              sortMethod: INITIAL_SORT_METHOD,
              sortAscending: INITIAL_SORT_ASCENDING,
            }),
        },
      }),
      {
        name: 'usePoolTableStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}

const PoolTableStoreContext = createContext<PoolTableStore | null>(null)

export function PoolTableStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [store] = useState(() => createPoolTableStore())

  return <PoolTableStoreContext.Provider value={store}>{children}</PoolTableStoreContext.Provider>
}

function usePoolTableStoreBase(): PoolTableStore {
  const store = useContext(PoolTableStoreContext)

  if (!store) {
    throw new Error('usePoolTableStore must be used within PoolTableStoreContextProvider')
  }

  return store
}

export function usePoolTableStore<T>(selector: (state: Omit<PoolTableState, 'actions'>) => T): T {
  const store = usePoolTableStoreBase()
  return useStore(store, useShallow(selector))
}

export function usePoolTableStoreActions(): PoolTableState['actions'] {
  const store = usePoolTableStoreBase()
  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
