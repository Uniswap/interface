import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { createContext, useContext, useState } from 'react'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { TimePeriod } from '~/appGraphql/data/util'

/* eslint-disable import/no-unused-modules -- enums used by filter components and useTopAuctions */
export enum AuctionVerificationFilter {
  All = 'all',
  Verified = 'verified',
  Unverified = 'unverified',
}

export enum AuctionStatusFilter {
  All = 'all',
  Active = 'active',
  Complete = 'complete',
}

interface ExploreTablesFilterActions {
  setFilterString: (value: string) => void
  setTimePeriod: (period: TimePeriod) => void
  setVerificationFilter: (filter: AuctionVerificationFilter) => void
  setStatusFilter: (filter: AuctionStatusFilter) => void
  setSelectedProtocol: (protocol: ProtocolVersion) => void
}

interface ExploreTablesFilterState {
  filterString: string
  timePeriod: TimePeriod
  verificationFilter: AuctionVerificationFilter
  statusFilter: AuctionStatusFilter
  selectedProtocol: ProtocolVersion
  actions: ExploreTablesFilterActions
}

type ExploreTablesFilterStore = UseBoundStore<StoreApi<ExploreTablesFilterState>>

const INITIAL_FILTER_STRING = ''
const INITIAL_TIME_PERIOD = TimePeriod.DAY
const INITIAL_VERIFICATION = AuctionVerificationFilter.All
const INITIAL_STATUS = AuctionStatusFilter.All
const INITIAL_PROTOCOL = ProtocolVersion.UNSPECIFIED

export function createExploreTablesFilterStore(): ExploreTablesFilterStore {
  return create<ExploreTablesFilterState>()(
    devtools(
      (set) => ({
        filterString: INITIAL_FILTER_STRING,
        timePeriod: INITIAL_TIME_PERIOD,
        verificationFilter: INITIAL_VERIFICATION,
        statusFilter: INITIAL_STATUS,
        selectedProtocol: INITIAL_PROTOCOL,
        actions: {
          setFilterString: (value) => set({ filterString: value }),
          setTimePeriod: (period) => set({ timePeriod: period }),
          setVerificationFilter: (filter) => set({ verificationFilter: filter }),
          setStatusFilter: (filter) => set({ statusFilter: filter }),
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
