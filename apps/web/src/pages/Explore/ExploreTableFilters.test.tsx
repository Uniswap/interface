import { act, render, screen } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { ComponentProps } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import {
  EMPTY_EXPLORE_POOLS_FILTER_STATE,
  type ExplorePoolsFilterState,
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
} from '~/features/Explore/state/exploreTablesFilterStore'
import type { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import { ExploreTableFilters } from '~/pages/Explore/ExploreTableFilters'
import { mocked } from '~/test-utils/mocked'
import { ExploreTab } from '~/types/explore'
import { EMPTY_POOLS_FILTER_STATE } from '~/types/poolsFilter'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

// The filter UI itself is covered elsewhere; here only the wiring between it, the URL and the store matters.
let filterProps: ComponentProps<typeof PoolsFilter> | undefined
vi.mock('~/features/Liquidity/PoolsFilter/PoolsFilter', () => ({
  PoolsFilter: (props: ComponentProps<typeof PoolsFilter>) => {
    filterProps = props
    return <div data-testid="pools-filter" />
  },
}))

function StoreProbe(): JSX.Element {
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  return <span data-testid="store">{JSON.stringify(poolsFilter)}</span>
}

function LocationProbe(): JSX.Element {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{`${pathname}${search}`}</span>
}

function Harness(): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <ExploreTableFilters
        currentKey={ExploreTab.Pools}
        tabSupportedNetworks={[UniverseChainId.Mainnet, UniverseChainId.Base]}
      />
      <StoreProbe />
      <LocationProbe />
    </ExploreTablesFilterStoreContextProvider>
  )
}

// Mirrors the app's `/explore` route in Body.tsx: the nested paths are children of the parent route and
// render the same element, but the parent's element (RedirectExplore) has no <Outlet />, so for every nested
// path it is the parent element that renders — never swapped, which is what lets the page and its filter
// store survive a chain-segment change. `useParams` still reports the deepest match's `:tab`/`:chainName`.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explore" element={<Harness />}>
          <Route path=":tab" element={<Harness />} />
          <Route path=":chainName" element={<Harness />} />
          <Route path=":tab/:chainName" element={<Harness />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function apply(next: Parameters<NonNullable<typeof filterProps>['onApply']>[0]): void {
  act(() => filterProps?.onApply(next))
}

function storedFilter(): unknown {
  return JSON.parse(screen.getByTestId('store').textContent)
}

describe('ExploreTableFilters (advanced pools filtering)', () => {
  beforeEach(() => {
    filterProps = undefined
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AdvancedPoolsFiltering)
  })

  it('reads the filter chain from the URL chain segment', () => {
    renderAt('/explore/pools/base')

    expect(filterProps?.value).toEqual({ ...EMPTY_POOLS_FILTER_STATE, chainId: UniverseChainId.Base })
    // The store never holds the chain; the URL does.
    expect(storedFilter()).toEqual(EMPTY_EXPLORE_POOLS_FILTER_STATE)
  })

  it('writes a network change to the URL, keeping the query string', () => {
    renderAt('/explore/pools?foo=bar')

    apply({ ...EMPTY_POOLS_FILTER_STATE, chainId: UniverseChainId.Base })

    expect(screen.getByTestId('location').textContent).toBe('/explore/pools/base?foo=bar')
    expect(filterProps?.value.chainId).toBe(UniverseChainId.Base)
    expect(storedFilter()).toEqual(EMPTY_EXPLORE_POOLS_FILTER_STATE)
  })

  it('drops the chain segment when the filter is cleared to all networks', () => {
    renderAt('/explore/pools/base')

    apply(EMPTY_POOLS_FILTER_STATE)

    expect(screen.getByTestId('location').textContent).toBe('/explore/pools')
    expect(filterProps?.value.chainId).toBeUndefined()
  })

  it('keeps the other committed filters across a network change', () => {
    renderAt('/explore/pools')

    apply({ ...EMPTY_POOLS_FILTER_STATE, protocols: [ProtocolVersion.V3] })
    expect(screen.getByTestId('location').textContent).toBe('/explore/pools')

    apply({ ...EMPTY_POOLS_FILTER_STATE, protocols: [ProtocolVersion.V3], chainId: UniverseChainId.Mainnet })

    expect(screen.getByTestId('location').textContent).toBe('/explore/pools/ethereum')
    expect(filterProps?.value).toEqual({
      ...EMPTY_POOLS_FILTER_STATE,
      protocols: [ProtocolVersion.V3],
      chainId: UniverseChainId.Mainnet,
    })
  })

  it('refuses to store a filter that carries a chain, at the type level', () => {
    // @ts-expect-error — a full PoolsFilterState has `chainId: UniverseChainId | undefined`; the store's type says `never`
    const stored: ExplorePoolsFilterState = EMPTY_POOLS_FILTER_STATE
    expect(stored).toBeDefined()
  })

  it('does not navigate when only non-chain fields change', () => {
    renderAt('/explore/pools/base')

    apply({ ...EMPTY_POOLS_FILTER_STATE, chainId: UniverseChainId.Base, rewardsOnly: true })

    expect(screen.getByTestId('location').textContent).toBe('/explore/pools/base')
    expect(storedFilter()).toEqual({ ...EMPTY_EXPLORE_POOLS_FILTER_STATE, rewardsOnly: true })
  })
})
