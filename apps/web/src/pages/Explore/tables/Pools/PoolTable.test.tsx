import '~/test-utils/tokens/mocks'
import type { UseQueryResult } from '@tanstack/react-query'
import { SharedEventName } from '@uniswap/analytics-events'
import { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { buildHookRegistryMap, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { ElementName, InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { COLLAPSE_PROGRESS_VAR, COLLAPSE_TEXT_VISIBILITY_VAR } from '~/components/Table/PinnedColumns/collapse/utils'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection, TimePeriod } from '~/data/util'
import {
  EMPTY_EXPLORE_POOLS_FILTER_STATE,
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { toRewardAprEntries } from '~/features/Liquidity/LPIncentives/utils'
import { useListPools } from '~/pages/Explore/hooks/useListPools'
import { ExploreTopPoolTable, PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider } from '~/pages/Explore/tables/Pools/poolTableStore'
import { mocked } from '~/test-utils/mocked'
import { validRestPoolToken0, validRestPoolToken1 } from '~/test-utils/pools/fixtures'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'
import type { PoolStat } from '~/types/explore'

function renderWithProvider(ui: React.ReactElement) {
  return render(<ExploreTablesFilterStoreContextProvider>{ui}</ExploreTablesFilterStoreContextProvider>)
}

/** Renders the store's published pools APR range as text so a test can observe what the table wrote. */
function AprRangeProbe() {
  const range = useExploreTablesFilterStore((s) => s.poolsAprRange)
  return <span>{range ? `apr ${range.min}-${range.max}` : 'apr none'}</span>
}

const HOOKED_ADDRESS = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'

const { sendEvent } = vi.hoisted(() => ({ sendEvent: vi.fn() }))

vi.unmock('uniswap/src/features/telemetry/Trace')
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: { ELEMENT_CLICKED: 'Element Clicked', PAGE_VIEWED: 'Page Viewed' },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))
vi.mock('utilities/src/telemetry/analytics/analytics', async (importOriginal) => {
  const original = await importOriginal<typeof import('utilities/src/telemetry/analytics/analytics')>()
  return { ...original, analytics: { ...original.analytics, sendEvent } }
})

/** A mainnet pool row with just enough shape to render; override what a test cares about. */
function poolStat(overrides: Partial<PoolStat>): PoolStat {
  return {
    id: '1',
    chainId: UniverseChainId.Mainnet,
    token0: validRestPoolToken0,
    isToken0Quote: true,
    token1: validRestPoolToken1,
    feeTier: { feeAmount: 500, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false },
    txCount: 1,
    totalLiquidity: { value: 1 },
    volume1Day: { value: 1 },
    volume30Day: { value: 1 },
    apr: 1,
    volOverTvl: 1,
    protocolVersion: 'V3',
    ...overrides,
  } as unknown as PoolStat
}

vi.mock('~/pages/Explore/hooks/useListPools')
vi.mock('uniswap/src/features/telemetry/send')
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery')
// Passthrough spy: real engine behavior, observable inputs/outputs.
vi.mock('uniswap/src/features/fees/getFeeBreakdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/fees/getFeeBreakdown')>()
  return { ...actual, getFeeBreakdown: vi.fn(actual.getFeeBreakdown) }
})
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('uniswap/src/features/poolHooks/hooks/useHookRegistryMap', async () => {
  const actual = await vi.importActual('uniswap/src/features/poolHooks/hooks/useHookRegistryMap')
  return {
    ...actual,
    useHookRegistryMap: vi.fn(),
  }
})
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    default: actual,
    useParams: vi
      .fn()
      .mockReturnValue({ poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', chainName: 'ethereum' }),
  }
})

function mockPoolCategories(categories: PoolCategory[] | undefined): void {
  mocked(useListPoolCategoriesQuery).mockReturnValue({ data: categories } as UseQueryResult<PoolCategory[]>)
}

describe('PoolTable', () => {
  beforeEach(() => {
    vi.spyOn(dataApiServiceClientV2, 'getToken').mockResolvedValue(new GetTokenResponse())
    mocked(useFeatureFlag).mockReturnValue(false)
    mockPoolCategories(undefined)
  })

  it('renders loading state', () => {
    mocked(useListPools).mockReturnValue({
      isLoading: true,
      isError: false,
      pools: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(useListPools).mockReturnValue({
      isLoading: false,
      isError: true,
      pools: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  // The table body turns any error into a skeleton plus an error box regardless of how many rows it
  // holds, so a failed load-more used to blank a list the user was already reading. Every surface
  // hands its raw error straight to the table, so the "only when empty" rule has to live here.
  it('keeps the rows it has when a load-more fails, showing no error box', () => {
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({ id: 'pool-1' })]}
          loading={false}
          error
          chainId={UniverseChainId.Mainnet}
          surface="add-liquidity-pool-browser"
        />
      </PoolTableStoreContextProvider>,
    )

    expect(screen.queryByTestId('table-error-modal')).toBeNull()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('shows the error box when the failed load left no rows at all', () => {
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[]}
          loading={false}
          error
          chainId={UniverseChainId.Mainnet}
          surface="add-liquidity-pool-browser"
        />
      </PoolTableStoreContextProvider>,
    )

    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
  })

  it('builds fixture-row destinations through the shared pool link builder', () => {
    const getLink = vi.fn(() => '/pool-destination')
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({ id: 'preview-pool' })]}
          loading={false}
          chainId={UniverseChainId.Mainnet}
          surface="hook-details"
          getLink={getLink}
        />
      </PoolTableStoreContextProvider>,
    )

    expect(getLink).toHaveBeenCalledWith(expect.objectContaining({ poolIdOrHash: 'preview-pool' }))
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pool-destination')
  })

  it('keeps the canonical pool destination and explicitly supplied row context', () => {
    render(
      <Trace page={InterfacePageName.HookDetailsPage}>
        <PoolTableStoreContextProvider>
          <PoolsTable
            pools={[poolStat({ id: 'real-pool', hookAddress: `0x${HOOKED_ADDRESS.slice(2).toUpperCase()}` })]}
            loading={false}
            chainId={UniverseChainId.Mainnet}
            surface="hook-details"
            rowAnalyticsProperties={{ hook_address: HOOKED_ADDRESS }}
          />
        </PoolTableStoreContextProvider>
      </Trace>,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/explore/pools/ethereum/real-pool')
    fireEvent.click(link)

    expect(sendEvent).toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({
        page: InterfacePageName.HookDetailsPage,
        element: ElementName.PoolsTableRow,
        chain_id: UniverseChainId.Mainnet,
        pool_address: 'real-pool',
        hook_address: HOOKED_ADDRESS,
      }),
    )
  })

  it.each([
    { surface: 'hook-details', value: 0, expected: '$0.00' },
    { surface: 'hook-details', value: undefined, expected: '-' },
    { surface: 'tdp', value: 0, expected: '$0.00' },
    { surface: 'tdp', value: undefined, expected: '-' },
    { surface: 'explore', value: 0, expected: '$0.00' },
    { surface: 'explore', value: undefined, expected: '-' },
  ] as const)('renders TVL $value as $expected on $surface', ({ surface, value, expected }) => {
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({ totalLiquidity: value === undefined ? undefined : { value } })]}
          loading={false}
          chainId={UniverseChainId.Mainnet}
          surface={surface}
          hideIndex
          hiddenColumns={[
            PoolSortFields.Apr,
            PoolSortFields.Volume24h,
            PoolSortFields.Volume30D,
            PoolSortFields.VolOverTvl,
          ]}
        />
      </PoolTableStoreContextProvider>,
    )

    expect(screen.getByText(expected)).toBeInTheDocument()
    if (expected === '-') {
      expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
    }
  })

  it('orders hook-detail columns like the design and identifies its sort surface', () => {
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({})]}
          loading={false}
          chainId={UniverseChainId.Mainnet}
          surface="hook-details"
          columnOrder={['poolDescription', 'tvl', 'apr']}
          volumeTimePeriod={TimePeriod.DAY}
          hideIndex
        />
      </PoolTableStoreContextProvider>,
    )

    const headings = ['Pool', 'TVL', 'Pool APR', '1D vol', 'Vol/TVL'].map((label) => screen.getByText(label))
    headings.slice(1).forEach((heading, index) => {
      expect(headings[index].compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    })
    fireEvent.click(screen.getByText('TVL'))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.ExploreTableSorted,
      expect.objectContaining({ table_type: 'pools', sort_method: PoolSortFields.TVL, surface: 'hook-details' }),
    )
  })

  it('controls hook badges and registry requests independently of the analytics surface', () => {
    const registry = buildHookRegistryMap(
      new HookListResponse({
        hooks: [new HookEntry({ address: HOOKED_ADDRESS, chainId: UniverseChainId.Mainnet, name: 'Registered hook' })],
      }),
    )
    const table = (surface: 'hook-details' | 'tdp', showHookBadges?: boolean): React.ReactElement => (
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({ hookAddress: HOOKED_ADDRESS })]}
          loading={false}
          chainId={UniverseChainId.Mainnet}
          surface={surface}
          showHookBadges={showHookBadges}
        />
      </PoolTableStoreContextProvider>
    )
    mocked(useHookRegistryMap).withImplementation(
      () => registry,
      () => {
        const { rerender } = render(table('hook-details', false))

        expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: false })
        expect(screen.queryByText('Registered hook')).not.toBeInTheDocument()
        expect(screen.queryByText('0x0010...1888')).not.toBeInTheDocument()

        rerender(table('tdp', false))
        expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: false })
        expect(screen.queryByText('Registered hook')).not.toBeInTheDocument()

        rerender(table('hook-details'))
        expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: true })
        expect(screen.getByRole('link', { name: /Registered hook/ })).toBeInTheDocument()

        rerender(table('tdp'))

        expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: UniverseChainId.Mainnet, enabled: true })
        expect(screen.getByRole('link', { name: /Registered hook/ })).toBeInTheDocument()
      },
    )
  })

  it('renders data filled state', () => {
    const hookAddress = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'
    const mockData = [
      {
        id: '1',
        chainId: UniverseChainId.Mainnet,
        token0: validRestPoolToken0,
        isToken0Quote: true,
        token1: validRestPoolToken1,
        feeTier: {
          feeAmount: 10000,
          tickSpacing: DEFAULT_TICK_SPACING,
          isDynamic: false,
        },
        txCount: 200,
        totalLiquidity: { value: 300 },
        volume1Day: { value: 400 },
        volume30Day: { value: 500 },
        apr: 6,
        volOverTvl: 1.84,
        protocolVersion: 'V3',
      },
      {
        id: '2',
        chainId: UniverseChainId.Mainnet,
        token0: validRestPoolToken0,
        isToken0Quote: true,
        token1: validRestPoolToken1,
        feeTier: {
          feeAmount: 500,
          tickSpacing: DEFAULT_TICK_SPACING,
          isDynamic: false,
        },
        txCount: 100,
        totalLiquidity: { value: 200 },
        volume1Day: { value: 300 },
        volume30Day: { value: 400 },
        apr: 4,
        volOverTvl: 1.5,
        protocolVersion: 'V4',
        hookAddress,
      },
    ] as unknown as PoolStat[]
    mocked(useListPools).mockReturnValue({
      pools: mockData,
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })
    mocked(useHookRegistryMap).mockReturnValue(
      buildHookRegistryMap(
        new HookListResponse({
          hooks: [
            new HookEntry({
              address: hookAddress,
              chain: 'Ethereum',
              chainId: 1,
              name: 'TestHook',
              description: 'Adjusts LP fees dynamically',
            }),
          ],
        }),
      ),
    )

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    expect(screen.getByTestId('top-pools-explore-table')).not.toBeNull()
    // Protocol, fee tier, and hook info collapse into the Pool column's second line — no
    // standalone columns for them
    expect(screen.queryByText('Protocol')).toBeNull()
    expect(screen.queryByText('Fee tier')).toBeNull()
    expect(screen.queryByText('Hook')).toBeNull()
    // FeeDisplay renders the fee as its own element, so the detail line is a version span next to a
    // fee span rather than one joined "v3 · 1%" string.
    expect(screen.getAllByText('v3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('v4').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0.05%').length).toBeGreaterThan(0)
    // The v4 pool's hook resolves to its registry name as plain text; the v3 pool shows no hook
    expect(screen.getAllByText('TestHook').length).toBeGreaterThan(0)
    // A chain-filtered list scopes the hook-registry fetch to that chain instead of loading every chain's
    expect(mocked(useHookRegistryMap)).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, enabled: true })
    // The pair's text fades with the mobile pinned-column collapse (jsdom drops the calc() opacity),
    // leaving the pair logo; the logo gap closes from 8px.
    const poolText = screen.getAllByText('v3')[0].closest<HTMLElement>(`[style*="${COLLAPSE_TEXT_VISIBILITY_VAR}"]`)
    expect(poolText).not.toBeNull()
    expect(poolText?.parentElement?.style.columnGap).toBe(`calc((1 - var(${COLLAPSE_PROGRESS_VAR}, 0)) * 8px)`)
    expect(asFragment()).toMatchSnapshot()

    // The dialog's extra details are not rendered until the hook name is clicked
    expect(screen.queryByText('Adjusts LP fees dynamically')).toBeNull()
    fireEvent.click(screen.getAllByText('TestHook')[0])
    expect(screen.getByText('Adjusts LP fees dynamically')).toBeTruthy()
  })

  it('loads the full cross-chain hook registry when a hooked list is not filtered to a chain', () => {
    mocked(useListPools).mockReturnValue({
      pools: [poolStat({ id: '1', protocolVersion: 'V4', hookAddress: HOOKED_ADDRESS })],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)

    expect(mocked(useHookRegistryMap)).toHaveBeenCalledWith({ chainId: undefined, enabled: true })
  })

  it('scopes the pools query to the URL chain', () => {
    // The filter's Network control reads and writes the URL chain segment, so a direct link like
    // /explore/pools/ethereum must filter the table. The chain travels on the `chainId` arg with
    // `poolsFilter.chainId` unset; resolvePoolsListChainId (getPoolsListParams.test.ts) covers that the
    // surface chain then scopes the request.
    mocked(useListPools).mockReturnValue({
      pools: [],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)

    expect(mocked(useListPools)).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: UniverseChainId.Mainnet, poolsFilter: EMPTY_EXPLORE_POOLS_FILTER_STATE }),
    )
  })

  it('falls back to the truncated hook address when the registry has no entry for the hook', () => {
    mocked(useListPools).mockReturnValue({
      pools: [poolStat({ id: '1', protocolVersion: 'V4', hookAddress: HOOKED_ADDRESS })],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })
    // Registry loaded, but this hook isn't listed in it
    mocked(useHookRegistryMap).mockReturnValue(new Map())

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)

    expect(screen.getByText('0x0010...1888')).toBeTruthy()
  })

  it('skips the hook-registry fetch when nothing listed has a hook', () => {
    mocked(useListPools).mockReturnValue({
      pools: [
        poolStat({ id: '1', protocolVersion: 'V3' }),
        // a v4 pool with no hook reports the zero address, which must not count as hooked
        poolStat({ id: '2', protocolVersion: 'V4', hookAddress: ZERO_ADDRESS }),
      ],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)

    expect(mocked(useHookRegistryMap)).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet, enabled: false })
  })

  // Regression: the table used to read the search off the Explore tables filter store for its row
  // analytics, which only Explore's own SearchBar writes — so the pool browser and TDP reported an
  // empty search however the user had searched, and both had to mount the Explore store just to be
  // rendered. Rendering with no such provider is what pins that dependency as gone: a reinstated
  // store read throws "must be used within ExploreTablesFilterStoreContextProvider" here.
  it('renders outside the Explore filter store, taking its search as a prop', () => {
    render(
      <PoolTableStoreContextProvider>
        <PoolsTable
          pools={[poolStat({ id: 'pool-1' })]}
          loading={false}
          chainId={UniverseChainId.Mainnet}
          surface="add-liquidity-pool-browser"
          filterString="usdc"
        />
      </PoolTableStoreContextProvider>,
    )

    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  describe('selected-period volume', () => {
    function PeriodControls(): JSX.Element {
      const { setTimePeriod } = useExploreTablesFilterStoreActions()
      const period = useExploreTablesFilterStore((s) => s.timePeriod)
      return (
        <>
          <button onClick={() => setTimePeriod(TimePeriod.HOUR)}>Choose 1H</button>
          <button onClick={() => setTimePeriod(TimePeriod.DAY)}>Choose 1D</button>
          <button onClick={() => setTimePeriod(TimePeriod.MONTH)}>Choose 30D</button>
          <span>Stored period: {period}</span>
        </>
      )
    }

    function expectSort(sortBy: PoolSortFields, sortDirection = OrderDirection.Desc): void {
      expect(useListPools).toHaveBeenLastCalledWith(expect.objectContaining({ sortState: { sortBy, sortDirection } }))
    }

    function renderPeriodTable(surface: 'explore' | 'positions-discovery' = 'explore') {
      return renderWithProvider(
        <>
          <PeriodControls />
          <ExploreTopPoolTable surface={surface} />
        </>,
      )
    }

    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
      mocked(useListPools).mockReturnValue({
        pools: [
          poolStat({
            totalLiquidity: { value: 100 },
            volume1Day: { value: 40 },
            volume30Day: { value: 900 },
            volOverTvl: 0.4,
          }),
        ],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
        chainId: UniverseChainId.Mainnet,
      })
    })

    it('uses the same period for the single volume column, ratio and server sort', () => {
      renderPeriodTable()
      expect(screen.getByText('1D vol')).toBeInTheDocument()
      expect(screen.getByText('Vol/TVL')).toBeInTheDocument()
      expect(screen.queryByText('Volume')).not.toBeInTheDocument()
      expect(screen.queryByText('30D vol')).not.toBeInTheDocument()
      expect(screen.getByText('$40.00')).toBeInTheDocument()
      expect(screen.queryByText('$900.00')).not.toBeInTheDocument()
      expect(screen.getByText('0.40')).toBeInTheDocument()
      expectSort(PoolSortFields.Volume24h)

      fireEvent.click(screen.getByText('Choose 30D'))
      expect(screen.getByText('30D vol')).toBeInTheDocument()
      expect(screen.queryByText('1D vol')).not.toBeInTheDocument()
      expect(screen.getByText('$900.00')).toBeInTheDocument()
      expect(screen.queryByText('$40.00')).not.toBeInTheDocument()
      expect(screen.getByText('9.00')).toBeInTheDocument()
      expectSort(PoolSortFields.Volume30D)

      fireEvent.click(screen.getByText('30D vol'))
      expectSort(PoolSortFields.Volume30D, OrderDirection.Asc)
      fireEvent.click(screen.getByText('Choose 1D'))
      expectSort(PoolSortFields.Volume24h, OrderDirection.Asc)
      fireEvent.click(screen.getByText('1D vol'))
      expectSort(PoolSortFields.Volume24h)
    })

    it('falls back from 1D ratio ordering to volume on 30D and disables ratio sorting', () => {
      renderPeriodTable()
      fireEvent.click(screen.getByText('Vol/TVL'))
      expectSort(PoolSortFields.VolOverTvl)
      fireEvent.click(screen.getByText('Choose 30D'))
      expectSort(PoolSortFields.Volume30D)
      mocked(sendAnalyticsEvent).mockClear()
      fireEvent.click(screen.getByText('Vol/TVL'))
      expectSort(PoolSortFields.Volume30D)
      expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(InterfaceEventName.ExploreTableSorted, expect.anything())
      fireEvent.click(screen.getByText('30D vol'))
      expectSort(PoolSortFields.Volume30D, OrderDirection.Asc)
    })

    it.each([
      { status: 'loading', isLoading: true, isError: false },
      { status: 'error', isLoading: false, isError: true },
    ])('renders selected-period skeletons during $status', ({ isLoading, isError }) => {
      mocked(useListPools).mockReturnValue({
        pools: [],
        isLoading,
        isError,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
      })

      renderPeriodTable()

      expect(screen.getByText('Vol/TVL')).toBeInTheDocument()
      expect(screen.getAllByTestId('cell-loading-bubble').length).toBeGreaterThan(0)
    })

    it('derives 1D from an unsupported shared period without changing it', () => {
      renderPeriodTable()
      fireEvent.click(screen.getByText('Choose 1H'))
      expect(screen.getByText('Stored period: H')).toBeInTheDocument()
      expect(screen.getByText('$40.00')).toBeInTheDocument()
      expectSort(PoolSortFields.Volume24h)
    })

    it.each(['explore', 'positions-discovery'] as const)(
      'keeps fixed columns for %s when the period mode is inactive',
      (surface) => {
        if (surface === 'explore') {
          mocked(useFeatureFlag).mockReturnValue(false)
        }
        renderPeriodTable(surface)
        fireEvent.click(screen.getByText('Choose 30D'))
        expect(screen.getByText('1D vol')).toBeInTheDocument()
        expect(screen.getByText('30D vol')).toBeInTheDocument()
        expect(screen.getByText('1D vol/TVL')).toBeInTheDocument()
        expectSort(PoolSortFields.Volume24h)
      },
    )

    it.each([
      {
        period: TimePeriod.DAY,
        volume1Day: { value: 0 },
        volume30Day: undefined,
        volOverTvl: 0,
        volume: '$0.00',
        ratio: '0',
      },
      {
        period: TimePeriod.MONTH,
        volume1Day: undefined,
        volume30Day: { value: 0 },
        volOverTvl: undefined,
        volume: '$0.00',
        ratio: '0',
      },
      {
        period: TimePeriod.MONTH,
        volume1Day: { value: 40 },
        volume30Day: undefined,
        volOverTvl: 0.4,
        volume: '-',
        ratio: '-',
      },
    ])(
      'preserves zero and missing values for $period volume',
      ({ period, volume1Day, volume30Day, volOverTvl, volume, ratio }) => {
        mocked(useListPools).mockReturnValue({
          pools: [poolStat({ totalLiquidity: { value: 100 }, volume1Day, volume30Day, volOverTvl })],
          isLoading: false,
          isError: false,
          hasNextPage: false,
          isFetchingNextPage: false,
          loadMore: vi.fn(),
        })
        renderPeriodTable()
        if (period === TimePeriod.MONTH) {
          fireEvent.click(screen.getByText('Choose 30D'))
        }
        expect(screen.getAllByText(volume).length).toBeGreaterThan(0)
        expect(screen.getAllByText(ratio).length).toBeGreaterThan(0)
        if (volume === '-') {
          expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
          expect(screen.getAllByText('-')).toHaveLength(2)
        }
      },
    )

    it.each(['explore', 'positions-discovery'] as const)('keeps zero placeholders on inactive %s tables', (surface) => {
      if (surface === 'explore') {
        mocked(useFeatureFlag).mockReturnValue(false)
      }
      mocked(useListPools).mockReturnValue({
        pools: [
          poolStat({
            totalLiquidity: { value: 100 },
            volume1Day: { value: 0 },
            volume30Day: { value: 0 },
            volOverTvl: 0,
          }),
        ],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
      })

      renderPeriodTable(surface)

      expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
      expect(screen.queryByText('0')).not.toBeInTheDocument()
      expect(screen.getAllByText('-')).toHaveLength(3)
    })
  })

  describe('category tags', () => {
    const stables = poolCategory({ id: 'stable-pools', name: 'Stables' })
    const majors = poolCategory({ id: 'major-pools', name: 'Majors' })
    const taggedPool = poolStat({ id: 'pool-1', categoryIds: ['not-a-category', 'stable-pools', 'major-pools'] })

    function renderTable(props: {
      surface: 'explore' | 'tdp' | 'hook-details' | 'add-liquidity-pool-browser'
      scopedCategoryId?: string
    }) {
      return render(
        <PoolTableStoreContextProvider>
          <PoolsTable pools={[taggedPool]} loading={false} chainId={UniverseChainId.Mainnet} {...props} />
        </PoolTableStoreContextProvider>,
      )
    }

    beforeEach(() => {
      mockPoolCategories([stables, majors])
    })

    it('tags an Explore row with its first known category on the details line', () => {
      renderTable({ surface: 'explore' })
      expect(screen.getByTestId(TestID.PoolRowCategoryTag)).toHaveTextContent('Stables')
    })

    it('skips the scoped category and tags the next one', () => {
      renderTable({ surface: 'explore', scopedCategoryId: 'stable-pools' })
      expect(screen.getByTestId(TestID.PoolRowCategoryTag)).toHaveTextContent('Majors')
    })

    it('tags the Create Position pool browser rows', () => {
      renderTable({ surface: 'add-liquidity-pool-browser' })
      expect(screen.getByTestId(TestID.PoolRowCategoryTag)).toHaveTextContent('Stables')
    })

    it.each(['tdp', 'hook-details'] as const)('renders no tag and skips the categories query on %s', (surface) => {
      renderTable({ surface })
      expect(screen.queryByTestId(TestID.PoolRowCategoryTag)).toBeNull()
      expect(useListPoolCategoriesQuery).toHaveBeenCalledWith({ enabled: false })
    })
  })

  it('publishes the loaded rows APR range to the filter store and clears it when the table unmounts', () => {
    mocked(useListPools).mockReturnValue({
      pools: [
        poolStat({ id: '1', apr: 4.989 }),
        poolStat({ id: '2', apr: 0.83 }),
        poolStat({ id: '3', apr: undefined }),
      ],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    const { rerender } = renderWithProvider(
      <>
        <ExploreTopPoolTable surface="explore" />
        <AprRangeProbe />
      </>,
    )
    expect(screen.getByText('apr 0.83-4.99')).toBeInTheDocument()

    // Same provider element at the same tree position, so the store instance survives and only the table's
    // effect cleanup ran.
    rerender(
      <ExploreTablesFilterStoreContextProvider>
        <AprRangeProbe />
      </ExploreTablesFilterStoreContextProvider>,
    )
    expect(screen.getByText('apr none')).toBeInTheDocument()
  })

  it('renders the pair logo from the served row logos, keeping the bundled asset for a native leg', () => {
    const servedToken0Logo = 'https://served.example/usdc.png'
    // The WETH leg unwraps to ETH for display, so its served wrapped-token logo must not show.
    const servedToken1Logo = 'https://served.example/weth.png'
    mocked(useListPools).mockReturnValue({
      pools: [
        poolStat({
          // Same cast as the fixtures: `PoolStat.token0` is the protobuf class, the spread is a plain object.
          token0: { ...validRestPoolToken0, logo: servedToken0Logo } as unknown as PoolStat['token0'],
          token1: { ...validRestPoolToken1, logo: servedToken1Logo } as unknown as PoolStat['token1'],
        }),
      ],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })

    const { container } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    const sources = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    expect(sources).toContain(servedToken0Logo)
    expect(sources).not.toContain(servedToken1Logo)
    expect(sources).toContain(
      getCommonBase(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet))?.logoUrl,
    )
  })

  it('unwraps a v2/v3 wrapped-native leg to the native currency', () => {
    mocked(useListPools).mockReturnValue({
      pools: [poolStat({ protocolVersion: 'V3' })],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument()
  })

  it('leaves a v4 wrapped-native leg as the wrapped token', () => {
    const servedToken1Logo = 'https://served.example/weth.png'
    mocked(useListPools).mockReturnValue({
      pools: [
        poolStat({
          protocolVersion: 'V4',
          // Same cast as the fixtures: `PoolStat.token1` is the protobuf class, the spread is a plain object.
          token1: { ...validRestPoolToken1, logo: servedToken1Logo } as unknown as PoolStat['token1'],
        }),
      ],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
      chainId: UniverseChainId.Mainnet,
    })

    const { container } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
    // A v4 pool can hold either native or wrapped native, so the two must stay distinguishable.
    expect(screen.getByText('WETH/USDC')).toBeInTheDocument()
    const sources = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    expect(sources).toContain(servedToken1Logo)
  })

  describe('with LP incentives enabled', () => {
    // USDC on mainnet stands in for the served reward token: its CurrencyInfo — which the sub-line's
    // logo needs to render at all — is one of the few that resolve offline under test.
    function mockPool(boostedApr?: number, overrides: Partial<PoolStat> = {}) {
      const pool = {
        id: '1',
        chainId: UniverseChainId.Mainnet,
        token0: validRestPoolToken0,
        isToken0Quote: true,
        token1: validRestPoolToken1,
        feeTier: { feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false },
        txCount: 200,
        totalLiquidity: { value: 300 },
        volume1Day: { value: 400 },
        volume30Day: { value: 500 },
        apr: 6,
        volOverTvl: 1.84,
        protocolVersion: 'V4',
        boostedApr,
        rewards: boostedApr === undefined ? [] : toRewardAprEntries(boostedApr, USDC_MAINNET),
        ...overrides,
      } as unknown as PoolStat
      mocked(useListPools).mockReturnValue({
        pools: [pool],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
      })
    }

    it('renders the boosted APR as a sub-line of the APR cell, not its own column', () => {
      mockPool(66.9)
      const { asFragment } = renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.queryByText('Reward APR')).toBeNull()
      // Pool APR headline with the boosted APR stacked under it.
      expect(screen.getAllByText('6%').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/\+66\.9/).length).toBeGreaterThan(0)
      expect(asFragment()).toMatchSnapshot()
    })

    it('renders the reward token logo on the sub-line without a network badge', () => {
      mockPool(66.9)
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      // The reward token's chain belongs to the campaign, not to this row's pool, so its logo
      // carries no network badge — unlike the pool's own token logos, which do.
      const subLine = screen.getByText(/^\+66\.9/).parentElement
      expect(subLine?.querySelector('[data-testid="img-token-image"]')).toBeTruthy()
      expect(subLine?.querySelector('[data-testid^="network-logo-"]')).toBeNull()
      expect(screen.getAllByTestId('network-logo-1').length).toBeGreaterThan(0)
    })

    it('renders the APR cell alone for pools with no reward campaign', () => {
      mockPool()
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText('6%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^\+/)).toBeNull()
    })

    // Regression: rows carry the lowercase protocol label `convertPoolToPoolStat` stamps on them
    // ('v4'), so comparing against an uppercase 'V4' never matched in production — every v4 row
    // reached the APR tooltip with no currency info, leaving its pool-pair logo and network badge empty.
    it('resolves the pair currency info for a v4 row carrying the lowercase protocol label', async () => {
      mockPool(66.9, { protocolVersion: 'v4' })
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)

      fireEvent.mouseEnter(screen.getAllByText('6%')[0])

      const tooltip = await waitFor(() => {
        const el = document.getElementById('boosted-apr-tooltip')
        expect(el).not.toBeNull()
        return el as HTMLElement
      })
      // The Pool APR row's SplitLogo draws one leg per currency info; with none, CurrencyLogo renders
      // nothing in either half and the row's network badge falls back to no chain.
      expect(tooltip.querySelector('[data-testid="input-currency-logo-container"] img')).toBeTruthy()
      expect(tooltip.querySelector('[data-testid="output-currency-logo-container"] img')).toBeTruthy()
      expect(tooltip.querySelector('[data-testid="network-logo-1"]')).toBeTruthy()
    })
  })

  describe('fee display column', () => {
    function mockPools(
      feeTier: { feeAmount: number; isDynamic: boolean },
      protocolVersion: 'V2' | 'V3' | 'V4',
      // Per-pool protocol fee (integer pips) as the data hook attaches it to each pool; the
      // fee-display column reads it straight off `pool.protocolFeePips`.
      served: { protocolFee?: number; currentLpFee?: number } = {},
    ) {
      const pool = {
        id: '1',
        chainId: UniverseChainId.Mainnet,
        token0: validRestPoolToken0,
        isToken0Quote: true,
        token1: validRestPoolToken1,
        feeTier: { ...feeTier, tickSpacing: DEFAULT_TICK_SPACING },
        txCount: 200,
        totalLiquidity: { value: 300 },
        volume1Day: { value: 400 },
        volume30Day: { value: 500 },
        apr: 6,
        volOverTvl: 1.84,
        protocolVersion,
        protocolFeePips: served.protocolFee,
        currentLpFeePips: served.currentLpFee,
      } as unknown as PoolStat
      mocked(useListPools).mockReturnValue({
        pools: [pool],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
      })
    }

    it('renders a FeeDisplay for a static v4 fee tier', () => {
      mockPools({ feeAmount: 3000, isDynamic: false }, 'V4')
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      // FeeDisplay renders the fee standalone next to the version, not as the joined "v4 · 0.30%" text.
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v4 · /)).toBeNull()
    })

    it('keeps the Dynamic label for dynamic fee tiers instead of rendering the sentinel as a fee', () => {
      mockPools({ feeAmount: DYNAMIC_FEE_AMOUNT, isDynamic: true }, 'V4')
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText('Dynamic').length).toBeGreaterThan(0)
      // DYNAMIC_FEE_AMOUNT (8388608 pips) must never be formatted as a rate (~838%).
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('shows the served current fee for a dynamic fee tier', () => {
      // 7000 pips = 0.7%, what the pool's latest swap charged.
      mockPools({ feeAmount: DYNAMIC_FEE_AMOUNT, isDynamic: true }, 'V4', {
        currentLpFee: 7000,
      })
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText('0.70%').length).toBeGreaterThan(0)
      expect(screen.queryByText('Dynamic')).toBeNull()
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('renders the v2 fee through FeeDisplay', () => {
      mockPools({ feeAmount: 3000, isDynamic: false }, 'V2')
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v2 · /)).toBeNull()
    })

    it('feeds the backend-served protocol fee (pips) to the engine as bps and gets a served breakdown', () => {
      mocked(getFeeBreakdown).mockClear()
      // 500 pips = 5 bps served for a 30 bps v4 pool.
      mockPools({ feeAmount: 3000, isDynamic: false }, 'V4', { protocolFee: 500 })
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(getFeeBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({ feeAmount: 3000, servedProtocolFeeBps: 5 }),
      )
      const served = mocked(getFeeBreakdown)
        .mock.results.map((result) => result.value)
        .find((breakdown) => breakdown.protocolFeeBps !== undefined)
      // The served value wins: 30 LP + 5 protocol = 35 effective, no unavailable fallback.
      expect(served).toMatchObject({ lpFeeBps: 30, protocolFeeBps: 5, effectiveFeeBps: 35 })
    })

    it('is unavailable when the backend serves no protocol fee (the FE never computes fees)', () => {
      mocked(getFeeBreakdown).mockClear()
      mockPools({ feeAmount: 3000, isDynamic: false }, 'V4')
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(getFeeBreakdown).toHaveBeenCalledWith(expect.objectContaining({ servedProtocolFeeBps: undefined }))
      // Unavailable: every breakdown has an undefined protocol fee; the served path never runs.
      const protocolFees = mocked(getFeeBreakdown).mock.results.map((result) => result.value.protocolFeeBps)
      expect(protocolFees.length).toBeGreaterThan(0)
      expect(protocolFees.every((bps) => bps === undefined)).toBe(true)
    })
  })
})
