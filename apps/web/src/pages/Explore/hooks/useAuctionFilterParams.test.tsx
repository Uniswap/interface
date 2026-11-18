import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { describe, expect, it } from 'vitest'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { auctionFiltersFromParams, useSyncAuctionFilterParams } from '~/pages/Explore/hooks/useAuctionFilterParams'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'

describe('auctionFiltersFromParams', () => {
  it('parses known filter and status values', () => {
    expect(auctionFiltersFromParams(new URLSearchParams('filter=verified&status=upcoming'))).toEqual({
      quickFilter: AuctionQuickFilter.Verified,
      statusFilter: AuctionStatus.Upcoming,
    })
    expect(auctionFiltersFromParams(new URLSearchParams('filter=new&status=failed'))).toEqual({
      quickFilter: AuctionQuickFilter.New,
      statusFilter: AuctionStatus.Failed,
    })
  })

  it('returns undefined for missing, unknown, default, or retired values', () => {
    expect(auctionFiltersFromParams(new URLSearchParams())).toEqual({})
    expect(auctionFiltersFromParams(new URLSearchParams('filter=garbage&status=garbage'))).toEqual({})
    expect(auctionFiltersFromParams(new URLSearchParams('filter=all&status=all'))).toEqual({})
    expect(auctionFiltersFromParams(new URLSearchParams('filter=quick_launch'))).toEqual({})
  })

  it('maps a pre-status-dropdown ?filter= lifecycle value onto statusFilter', () => {
    expect(auctionFiltersFromParams(new URLSearchParams('filter=active'))).toEqual({
      statusFilter: AuctionStatus.Active,
    })
    expect(auctionFiltersFromParams(new URLSearchParams('filter=completed'))).toEqual({
      statusFilter: AuctionStatus.Launched,
    })
    expect(auctionFiltersFromParams(new URLSearchParams('filter=completed&status=upcoming'))).toEqual({
      statusFilter: AuctionStatus.Upcoming,
    })
  })
})

function createWrapper(initialEntry: string) {
  const initialAuctionFilters = auctionFiltersFromParams(new URL(initialEntry, 'https://app.uniswap.org').searchParams)
  return function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <ExploreTablesFilterStoreContextProvider initialAuctionFilters={initialAuctionFilters}>
          {children}
        </ExploreTablesFilterStoreContextProvider>
      </MemoryRouter>
    )
  }
}

function useTestHarness() {
  useSyncAuctionFilterParams()
  const { search } = useLocation()
  return {
    params: new URLSearchParams(search),
    navigationType: useNavigationType(),
    quickFilter: useExploreTablesFilterStore((state) => state.quickFilter),
    statusFilter: useExploreTablesFilterStore((state) => state.statusFilter),
    actions: useExploreTablesFilterStoreActions(),
  }
}

describe('useSyncAuctionFilterParams', () => {
  it('keeps the seeded ?filter= and ?status= values in the store and the URL', () => {
    const { result } = renderHook(useTestHarness, {
      wrapper: createWrapper('/explore/auctions?filter=verified&status=launched'),
    })

    expect(result.current.quickFilter).toBe(AuctionQuickFilter.Verified)
    expect(result.current.statusFilter).toBe(AuctionStatus.Launched)
    expect(result.current.params.get('filter')).toBe('verified')
    expect(result.current.params.get('status')).toBe('launched')
  })

  it('mirrors filter changes into the URL via history replace', () => {
    const { result } = renderHook(useTestHarness, { wrapper: createWrapper('/explore/auctions') })

    act(() => {
      result.current.actions.setQuickFilter(AuctionQuickFilter.New)
      result.current.actions.setStatusFilter(AuctionStatus.Active)
    })

    expect(result.current.params.get('filter')).toBe('new')
    expect(result.current.params.get('status')).toBe('active')
    expect(result.current.navigationType).toBe('REPLACE')
  })

  it('deletes a param when All is selected, leaving unrelated params intact', () => {
    const { result } = renderHook(useTestHarness, {
      wrapper: createWrapper('/explore/auctions?category=stocks&filter=verified&status=failed'),
    })

    act(() => {
      result.current.actions.setStatusFilter(AuctionStatus.All)
    })

    expect(result.current.params.get('status')).toBeNull()
    expect(result.current.params.get('filter')).toBe('verified')
    expect(result.current.params.get('category')).toBe('stocks')
  })

  it('rewrites a pre-status-dropdown ?filter= link to ?status=', () => {
    const { result } = renderHook(useTestHarness, { wrapper: createWrapper('/explore/auctions?filter=completed') })

    expect(result.current.quickFilter).toBe(AuctionQuickFilter.All)
    expect(result.current.statusFilter).toBe(AuctionStatus.Launched)
    expect(result.current.params.get('filter')).toBeNull()
    expect(result.current.params.get('status')).toBe('launched')
  })
})
