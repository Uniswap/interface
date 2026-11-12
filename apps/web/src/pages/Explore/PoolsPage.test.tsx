import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import type { ComponentProps } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import type Trace from 'uniswap/src/features/telemetry/Trace'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
} from '~/features/Explore/state/exploreTablesFilterStore'
import type { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import PoolsPage from '~/pages/Explore/PoolsPage'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

vi.mock('nuqs/adapters/react-router/v7', () => ({
  useOptimisticSearchParams: () => {
    const [searchParams] = useSearchParams()
    return searchParams
  },
}))

vi.mock('~/components/NetworkFilter/useFilteredChains', () => ({ useFilteredChainIds: vi.fn() }))
vi.mock('~/pages/Explore/hooks/useExploreHeartbeatCoordinator', () => ({
  useExploreHeartbeatCoordinator: vi.fn(),
}))
let pageTraceProperties: ComponentProps<typeof Trace>['properties']
vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children, page, properties }: ComponentProps<typeof Trace>) => {
    if (page === InterfacePageName.ExplorePage) {
      pageTraceProperties = properties
    }
    return <>{children}</>
  },
}))
vi.mock('~/pages/Explore/SearchBar', () => ({ SearchBar: () => null }))
vi.mock('~/features/Liquidity/PoolAreaHeroHeader', () => ({ PoolAreaHeroHeader: () => null }))
vi.mock('~/components/NotFoundModal/PoolNotFoundModal', () => ({
  PoolNotFoundModal: ({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Pool not found">
        <button onClick={closeModal}>Go back</button>
      </div>
    ) : null,
}))

let filterProps: ComponentProps<typeof PoolsFilter> | undefined
vi.mock('~/features/Liquidity/PoolsFilter/PoolsFilter', () => ({
  PoolsFilter: (props: ComponentProps<typeof PoolsFilter>) => {
    filterProps = props
    return <button onClick={() => props.onApply({ ...props.value, rewardsOnly: true })}>Apply rewards filter</button>
  },
}))
vi.mock('~/pages/Explore/categories/ExplorePoolsTab', () => ({
  ExplorePoolsTab: () => {
    const rewardsOnly = useExploreTablesFilterStore((s) => s.poolsFilter.rewardsOnly)
    const chainId = useChainIdFromUrlParam()
    return (
      <output aria-label="Pool results">{`${chainId ?? 'all'}: ${rewardsOnly ? 'Rewards only' : 'All pools'}`}</output>
    )
  },
}))

function LocationProbe(): JSX.Element {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current URL">{`${pathname}${search}`}</output>
      <button onClick={() => navigate(-1)}>Browser back</button>
    </>
  )
}

function renderAt(historyEntries: string[]): ReturnType<typeof render> {
  historyEntries.forEach((path, index) => {
    window.history[index === 0 ? 'replaceState' : 'pushState'](null, '', path)
  })
  return render(
    <BrowserRouter>
      <ExploreTablesFilterStoreContextProvider>
        <Routes>
          <Route path="/explore/pools" element={<PoolsPage />}>
            <Route path=":chainName" element={<PoolsPage />} />
          </Route>
          <Route path="*" element={null} />
        </Routes>
      </ExploreTablesFilterStoreContextProvider>
      <LocationProbe />
    </BrowserRouter>,
  )
}

describe('PoolsPage', () => {
  beforeEach(() => {
    filterProps = undefined
    pageTraceProperties = undefined
    vi.mocked(useFilteredChainIds).mockReturnValue([
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.Solana,
    ])
  })

  it.each([
    { path: '/explore/pools/base', chainName: 'base' },
    { path: '/explore/pools', chainName: undefined },
  ])('uses the URL network name in page telemetry for $path', ({ path, chainName }) => {
    renderAt([path])

    expect(pageTraceProperties).toMatchObject({ chainName })
  })

  it('shares applied filters with the pool table and retains the chain in its area links', () => {
    renderAt(['/explore/pools/base?category=lending'])

    expect(screen.getByRole('link', { name: 'Pools' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hooks' })).toHaveAttribute('href', '/explore/hooks/base?category=lending')
    expect(filterProps?.value.chainId).toBe(UniverseChainId.Base)
    expect(filterProps?.networks).toEqual([UniverseChainId.Mainnet, UniverseChainId.Base])
    expect(screen.getByLabelText('Pool results')).toHaveTextContent(`${UniverseChainId.Base}: All pools`)

    fireEvent.click(screen.getByRole('button', { name: 'Apply rewards filter' }))

    expect(screen.getByLabelText('Pool results')).toHaveTextContent(`${UniverseChainId.Base}: Rewards only`)
  })

  it('dismisses the PDP not-found dialog without leaving it in browser history when switching areas', async () => {
    renderAt(['/before', '/explore/pools/base?category=lending&type=pools&result=not-found'])

    expect(screen.getByRole('dialog', { name: 'Pool not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hooks' })).toHaveAttribute('href', '/explore/hooks/base?category=lending')

    fireEvent.click(screen.getByRole('link', { name: 'Hooks' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() => expect(screen.getByLabelText('Current URL')).toHaveTextContent('/before'))
  })

  it('wires the not-found dialog close action to the existing list recovery', () => {
    renderAt(['/explore/pools/base?type=pools&result=not-found'])

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/pools/base')
    expect(screen.getByLabelText('Pool results')).toHaveTextContent(`${UniverseChainId.Base}: All pools`)
  })
})
