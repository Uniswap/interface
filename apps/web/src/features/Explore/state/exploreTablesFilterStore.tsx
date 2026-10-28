import type { UniverseChainId } from '@universe/chains'
import { isDevEnv } from '@universe/environment'
import { createContext, useContext, useState } from 'react'
import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create, useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { TimePeriod } from '~/data/util'
import type { PoolsAprRange, PoolsFilterState } from '~/types/poolsFilter'

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

/**
 * The advanced pools filter minus its chain: on Explore the chain lives in the URL path (see
 * ExploreTableFilters), so the store must never hold one. `chainId` is `never` rather than just omitted
 * because structural typing would otherwise let a full {@link PoolsFilterState} through unnoticed.
 */
export type ExplorePoolsFilterState = Omit<PoolsFilterState, 'chainId'> & { chainId?: never }

export const EMPTY_EXPLORE_POOLS_FILTER_STATE: ExplorePoolsFilterState = {
  protocols: [],
  aprMin: '',
  aprMax: '',
  rewardsOnly: false,
  tvlBucketId: undefined,
}

interface ExploreTablesFilterActions {
  setFilterString: (value: string) => void
  setTimePeriod: (period: TimePeriod) => void
  setQuickFilter: (filter: AuctionQuickFilter) => void
  setPoolsFilter: (filter: ExplorePoolsFilterState) => void
  setPoolsAprRange: (range: PoolsAprRange | undefined) => void
  setFlexSlotCategoryId: (args: { kind: CategoryKind; categoryId: string }) => void
  setCategoryCheckChainId: (chainId: UniverseChainId) => void
  /** No-op if a newer pick replaced the check. */
  clearCategoryCheckChainId: (chainId: UniverseChainId) => void
}

interface ExploreTablesFilterState {
  filterString: string
  timePeriod: TimePeriod
  quickFilter: AuctionQuickFilter
  /** Advanced pools filter, committed by the modal's Apply button. */
  poolsFilter: ExplorePoolsFilterState
  /** APR range of the Pools table's loaded rows; the table publishes it so the filter modal can hint it. */
  poolsAprRange?: PoolsAprRange
  /**
   * Most recent non-spotlit Explore category selection per list kind, shown in that chip row's flex slot.
   * Lives here so the slot survives the section unmounting on a tab switch.
   */
  flexSlotCategoryIds: Partial<Record<CategoryKind, string>>
  /** Network just picked in the network filter, whose stats the selected category is checked against. */
  categoryCheckChainId?: UniverseChainId
  actions: ExploreTablesFilterActions
}

type ExploreTablesFilterStore = UseBoundStore<StoreApi<ExploreTablesFilterState>>

const INITIAL_FILTER_STRING = ''
const INITIAL_TIME_PERIOD = TimePeriod.DAY
const INITIAL_QUICK_FILTER = AuctionQuickFilter.All

export function createExploreTablesFilterStore(initialQuickFilter?: AuctionQuickFilter): ExploreTablesFilterStore {
  return create<ExploreTablesFilterState>()(
    devtools(
      (set) => ({
        filterString: INITIAL_FILTER_STRING,
        timePeriod: INITIAL_TIME_PERIOD,
        quickFilter: initialQuickFilter ?? INITIAL_QUICK_FILTER,
        poolsFilter: EMPTY_EXPLORE_POOLS_FILTER_STATE,
        poolsAprRange: undefined,
        flexSlotCategoryIds: {},
        categoryCheckChainId: undefined,
        actions: {
          setFilterString: (value) => set({ filterString: value }),
          setTimePeriod: (period) => set({ timePeriod: period }),
          setQuickFilter: (filter) => set({ quickFilter: filter }),
          setPoolsFilter: (filter) => set({ poolsFilter: filter }),
          setPoolsAprRange: (range) => set({ poolsAprRange: range }),
          setFlexSlotCategoryId: ({ kind, categoryId }) =>
            set((state) => ({ flexSlotCategoryIds: { ...state.flexSlotCategoryIds, [kind]: categoryId } })),
          setCategoryCheckChainId: (chainId) => set({ categoryCheckChainId: chainId }),
          clearCategoryCheckChainId: (chainId) =>
            set((state) => (state.categoryCheckChainId === chainId ? { categoryCheckChainId: undefined } : state)),
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

export function ExploreTablesFilterStoreContextProvider({
  children,
  initialQuickFilter,
}: {
  children: React.ReactNode
  /** Seeds the auction quick filter (e.g. from the URL) at store creation. */
  initialQuickFilter?: AuctionQuickFilter
}): JSX.Element {
  const [store] = useState(() => createExploreTablesFilterStore(initialQuickFilter))

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
