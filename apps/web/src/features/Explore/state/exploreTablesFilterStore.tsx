import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { isDevEnv } from '@universe/environment'
import { createContext, useContext, useState } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { TimePeriod } from '~/appGraphql/data/util'

/**
 * Single-select auction filter shared by the quick-filter pills and the Status dropdown.
 * Pills expose All/Verified/New/Completed; the dropdown exposes All/Active/Completed.
 */
export enum AuctionQuickFilter {
  All = 'all',
  Verified = 'verified',
  New = 'new',
  Active = 'active',
  Completed = 'completed',
  /** QuickLaunch (flag-gated chip): auctions matching the quick-launch preset fingerprint. */
  QuickLaunch = 'quick_launch',
}

interface ExploreTablesFilterActions {
  setFilterString: (value: string) => void
  setTimePeriod: (period: TimePeriod) => void
  setQuickFilter: (filter: AuctionQuickFilter) => void
  setSelectedProtocol: (protocol: ProtocolVersion) => void
}

interface ExploreTablesFilterState {
  filterString: string
  timePeriod: TimePeriod
  quickFilter: AuctionQuickFilter
  selectedProtocol: ProtocolVersion
  actions: ExploreTablesFilterActions
}

type ExploreTablesFilterStore = UseBoundStore<StoreApi<ExploreTablesFilterState>>

const INITIAL_FILTER_STRING = ''
const INITIAL_TIME_PERIOD = TimePeriod.DAY
const INITIAL_QUICK_FILTER = AuctionQuickFilter.All
const INITIAL_PROTOCOL = ProtocolVersion.UNSPECIFIED

export function createExploreTablesFilterStore(): ExploreTablesFilterStore {
  return create<ExploreTablesFilterState>()(
    devtools(
      (set) => ({
        filterString: INITIAL_FILTER_STRING,
        timePeriod: INITIAL_TIME_PERIOD,
        quickFilter: INITIAL_QUICK_FILTER,
        selectedProtocol: INITIAL_PROTOCOL,
        actions: {
          setFilterString: (value) => set({ filterString: value }),
          setTimePeriod: (period) => set({ timePeriod: period }),
          setQuickFilter: (filter) => set({ quickFilter: filter }),
          setSelectedProtocol: (protocol) => set({ selectedProtocol: protocol }),
        },
      }),
      {
        name: 'useExploreTablesFilterStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}

const ExploreTablesFilterStoreContext = createContext<ExploreTablesFilterStore | null>(null)

export function ExploreTablesFilterStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [store] = useState(() => createExploreTablesFilterStore())

  return <ExploreTablesFilterStoreContext.Provider value={store}>{children}</ExploreTablesFilterStoreContext.Provider>
}

function useExploreTablesFilterStoreBase(): ExploreTablesFilterStore {
  const store = useContext(ExploreTablesFilterStoreContext)

  if (!store) {
    throw new Error('useExploreTablesFilterStore must be used within ExploreTablesFilterStoreContextProvider')
  }

  return store
}

export function useExploreTablesFilterStore<T>(selector: (state: Omit<ExploreTablesFilterState, 'actions'>) => T): T {
  const store = useExploreTablesFilterStoreBase()
  return useStore(store, useShallow(selector))
}

export function useExploreTablesFilterStoreActions(): ExploreTablesFilterState['actions'] {
  const store = useExploreTablesFilterStoreBase()
  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
