import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { useRwaTableFilterEmptyState } from '~/pages/Explore/rwa/table/hooks/useRwaTableFilterEmptyState'
import { getChainUrlParam } from '~/utils/params/chainParams'

const ARBITRUM_URL_PARAM = getChainUrlParam(UniverseChainId.ArbitrumOne)

function SeedSearch({ value }: { value: string }): null {
  const { setFilterString } = useExploreTablesFilterStoreActions()

  useEffect(() => {
    setFilterString(value)
  }, [setFilterString, value])

  return null
}

function EmptyStateHarness({ isEmpty }: { isEmpty: boolean }): JSX.Element {
  const emptyState = useRwaTableFilterEmptyState(isEmpty)
  const { pathname, search } = useLocation()
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  return (
    <div>
      <span data-testid="url">{`${pathname}${search}`}</span>
      <span data-testid="filter-string">{filterString}</span>
      {emptyState ? <div data-testid="empty-state">{emptyState.action}</div> : null}
    </div>
  )
}

function renderHarness({
  initialEntry = '/explore/tokens?category=stocks',
  isEmpty = true,
  searchText = '',
}: {
  initialEntry?: string
  isEmpty?: boolean
  searchText?: string
} = {}) {
  const harness = <EmptyStateHarness isEmpty={isEmpty} />

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ExploreTablesFilterStoreContextProvider>
        <SeedSearch value={searchText} />
        <Routes>
          <Route path="/explore/:tab" element={harness} />
          <Route path="/explore/:tab/:chainName" element={harness} />
        </Routes>
      </ExploreTablesFilterStoreContextProvider>
    </MemoryRouter>,
  )
}

describe('useRwaTableFilterEmptyState', () => {
  it('does not prompt to clear filters when the table is empty with no filters applied', () => {
    renderHarness()

    expect(screen.queryByTestId('empty-state')).toBeNull()
  })

  it('does not prompt to clear filters while the table has rows', () => {
    renderHarness({ initialEntry: `/explore/tokens/${ARBITRUM_URL_PARAM}?category=stocks`, isEmpty: false })

    expect(screen.queryByTestId('empty-state')).toBeNull()
  })

  it('drops the chain from the URL while keeping the category', async () => {
    renderHarness({ initialEntry: `/explore/tokens/${ARBITRUM_URL_PARAM}?category=stocks` })

    await userEvent.click(screen.getByTestId(TestID.ExploreClearFilters))

    expect(screen.getByTestId('url').textContent).toBe('/explore/tokens?category=stocks')
  })

  it('clears the search filter', async () => {
    renderHarness({ searchText: 'nothing matches this' })

    expect(screen.getByTestId('filter-string').textContent).toBe('nothing matches this')

    await userEvent.click(screen.getByTestId(TestID.ExploreClearFilters))

    expect(screen.getByTestId('filter-string').textContent).toBe('')
  })
})
