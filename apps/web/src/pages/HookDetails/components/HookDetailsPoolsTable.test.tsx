import { useInfiniteQuery } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useMedia } from '@universe/mycelium'
import type { ComponentProps } from 'react'
import i18n from 'uniswap/src/i18n'
import { PoolSortFields } from '~/data/pools/poolStats'
import { TimePeriod } from '~/data/util'
import { createExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { LIVE_POOL_VOLUME_PERIODS } from '~/features/Explore/timeLabels'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { hookPoolsFixtureQueryOptions } from '~/features/Hooks/poolQueries'
import { type ListPoolsAsPoolStatsResult, useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import {
  PoolTableStoreContextProvider,
  usePoolTableStore,
  usePoolTableStoreActions,
} from '~/pages/Explore/tables/Pools/poolTableStore'
import { HookDetailsPoolsTable } from '~/pages/HookDetails/components/HookDetailsPoolsTable'
import { act, render, screen } from '~/test-utils/render'
import type { PoolStat } from '~/types/explore'

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useInfiniteQuery: vi.fn(),
}))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: vi.fn(),
}))
vi.mock('~/pages/Explore/hooks/useListPoolsAsPoolStats', () => ({ useListPoolsAsPoolStats: vi.fn() }))
vi.mock('~/features/Hooks/poolQueries', () => ({
  hookPoolsFixtureQueryOptions: vi.fn((args: Parameters<typeof hookPoolsFixtureQueryOptions>[0]) => ({
    queryKey: ['hook-pools-test', args],
  })),
}))
vi.mock('~/features/Explore/state/exploreTablesFilterStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Explore/state/exploreTablesFilterStore')>()),
  useExploreTablesFilterStore: (selector: (state: ReturnType<typeof exploreStore.getState>) => unknown) =>
    selector(exploreStore.getState()),
}))
vi.mock('~/features/Explore/VolumeTimeFrameSelector', () => ({
  VolumeTimeFrameSelector: vi.fn(() => null),
}))
vi.mock('~/pages/Explore/tables/Pools/PoolTable', () => ({
  PoolsTable: vi.fn(function MockPoolsTable({ pools }: ComponentProps<typeof PoolsTable>) {
    const { setSort } = usePoolTableStoreActions()

    return (
      <div data-testid="hook-pools-table">
        {pools?.map((pool) => (
          <div key={pool.id}>{pool.id}</div>
        ))}
        <button onClick={() => setSort(PoolSortFields.TVL, false)}>Sort by TVL</button>
        <button onClick={() => setSort(PoolSortFields.TVL, true)}>Sort by TVL ascending</button>
      </div>
    )
  }),
}))

const exploreStore = createExploreTablesFilterStore()
const DEPLOYMENT = { chainId: UniverseChainId.Mainnet, address: '0x1111111111111111111111111111111111111111' }
const BASE_DEPLOYMENT = { chainId: UniverseChainId.Base, address: '0x2222222222222222222222222222222222222222' }
const POOL: PoolStat = { id: 'selected-hook-pool', chainId: UniverseChainId.Mainnet }
const FIXTURE_POOL: PoolStat = { id: 'authored-preview-pool', chainId: UniverseChainId.Mainnet }
const refetch = vi.fn(async () => undefined)
const fetchNextPage = vi.fn()
const fixtureRefetch = vi.fn(async () => undefined)
const fixtureFetchNextPage = vi.fn()

function liveState(overrides: Partial<ListPoolsAsPoolStatsResult> = {}): void {
  vi.mocked(useListPoolsAsPoolStats).mockReturnValue({
    pools: [POOL],
    rawPoolCount: 1,
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    isSuccess: true,
    isFetchedAfterMount: true,
    refetch,
    isError: false,
    error: null,
    fetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    ...overrides,
  })
}

function fixtureState({
  pages = [{ pools: [FIXTURE_POOL], total: 12 }],
  ...overrides
}: {
  pages?: { pools: PoolStat[]; total: number }[]
  isLoading?: boolean
  isFetching?: boolean
  isPlaceholderData?: boolean
  isError?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isFetchNextPageError?: boolean
} = {}): void {
  vi.mocked(useInfiniteQuery).mockReturnValue({
    data: { pages, pageParams: [''] },
    isLoading: false,
    isFetching: overrides.isFetching ?? overrides.isLoading ?? false,
    isPlaceholderData: false,
    isError: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: fixtureFetchNextPage,
    refetch: fixtureRefetch,
    ...overrides,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

function lastLiveRequest(): Parameters<typeof useListPoolsAsPoolStats>[0] | undefined {
  return vi.mocked(useListPoolsAsPoolStats).mock.lastCall?.[0]
}

function tableProps(): ComponentProps<typeof PoolsTable> | undefined {
  return vi.mocked(PoolsTable).mock.lastCall?.[0]
}

function renderTable(isFixture = false): ReturnType<typeof render> {
  return render(<HookDetailsPoolsTable deployment={DEPLOYMENT} isFixture={isFixture} headingId="hook-pools-heading" />)
}

function OuterSort(): JSX.Element {
  const { sortMethod, sortAscending } = usePoolTableStore((state) => state)
  const { setSort } = usePoolTableStoreActions()

  return (
    <>
      <output data-testid="outer-sort">
        {sortMethod}:{String(sortAscending)}
      </output>
      <button onClick={() => setSort(PoolSortFields.Apr, true)}>Change outer sort</button>
    </>
  )
}

describe('HookDetailsPoolsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMedia).mockReturnValue({ md: false } as ReturnType<typeof useMedia>)
    exploreStore.setState({
      timePeriod: TimePeriod.DAY,
      filterString: 'unrelated token search',
      poolsFilter: { protocols: [ProtocolVersion.V3], aprMin: '10', aprMax: '20', rewardsOnly: true },
      flexSlotCategoryIds: { pool: 'unrelated-category' },
    })
    liveState()
    fixtureState()
  })

  it('requests only the selected chain and hook with v4 and quality gates, independently of Explore filters', () => {
    renderTable()

    expect(lastLiveRequest()).toMatchObject({
      enabled: true,
      persist: false,
      keepPreviousRows: true,
      params: {
        chainIds: [UniverseChainId.Mainnet],
        sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: false },
        filter: {
          hooks: DEPLOYMENT.address,
          protocolVersions: [ProtocolVersion.V4],
          includeSpam: false,
          applyTopLevelFilters: true,
        },
      },
    })
    expect(lastLiveRequest()?.params?.filter).toMatchObject({
      searchQuery: undefined,
      statsFilter: undefined,
      rewardsOnly: undefined,
      categoryIds: undefined,
    })
    expect(tableProps()).toMatchObject({
      surface: 'hook-details',
      chainId: UniverseChainId.Mainnet,
      showHookBadges: false,
      rowAnalyticsProperties: { hook_address: DEPLOYMENT.address.toLowerCase() },
      columnOrder: ['poolDescription', 'tvl', 'apr'],
    })
  })

  it('uses only the supported shared period and updates the volume ranking with it', () => {
    exploreStore.setState({ timePeriod: TimePeriod.WEEK })
    const { rerender } = renderTable()

    expect(tableProps()?.volumeTimePeriod).toBe(TimePeriod.DAY)
    expect(lastLiveRequest()?.params?.sort?.orderBy).toBe(PoolsOrderBy.VOLUME_1D)
    expect(vi.mocked(VolumeTimeFrameSelector).mock.lastCall?.[0]?.supportedPeriods).toEqual(LIVE_POOL_VOLUME_PERIODS)

    exploreStore.setState({ timePeriod: TimePeriod.MONTH })
    rerender(<HookDetailsPoolsTable deployment={DEPLOYMENT} isFixture={false} headingId="hook-pools-heading" />)

    expect(tableProps()?.volumeTimePeriod).toBe(TimePeriod.MONTH)
    expect(lastLiveRequest()?.params?.sort?.orderBy).toBe(PoolsOrderBy.VOLUME_30D)
  })

  it('starts new selected-deployment requests and resets the table sort on a keyed route change', async () => {
    const { rerender } = render(
      <HookDetailsPoolsTable key="ethereum" deployment={DEPLOYMENT} isFixture={false} headingId="pools" />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sort by TVL ascending' }))
    expect(lastLiveRequest()?.params?.sort).toEqual({ orderBy: PoolsOrderBy.TVL, ascending: true })

    rerender(<HookDetailsPoolsTable key="base" deployment={BASE_DEPLOYMENT} isFixture={false} headingId="pools" />)
    expect(lastLiveRequest()?.params).toMatchObject({
      chainIds: [UniverseChainId.Base],
      filter: { hooks: BASE_DEPLOYMENT.address },
      sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: false },
    })

    const address = '0x3333333333333333333333333333333333333333'
    rerender(
      <HookDetailsPoolsTable
        key={address}
        deployment={{ ...BASE_DEPLOYMENT, address }}
        isFixture={false}
        headingId="pools"
      />,
    )
    expect(lastLiveRequest()?.params?.filter?.hooks).toBe(address)
  })

  it('owns its sort store without reading or changing an enclosing Pools table store', async () => {
    render(
      <PoolTableStoreContextProvider>
        <OuterSort />
        <HookDetailsPoolsTable deployment={DEPLOYMENT} isFixture={false} headingId="pools" />
      </PoolTableStoreContextProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Change outer sort' }))
    expect(screen.getByTestId('outer-sort')).toHaveTextContent(`${PoolSortFields.Apr}:true`)
    expect(lastLiveRequest()?.params?.sort).toEqual({ orderBy: PoolsOrderBy.VOLUME_1D, ascending: false })

    await userEvent.click(screen.getByRole('button', { name: 'Sort by TVL' }))
    expect(lastLiveRequest()?.params?.sort).toEqual({ orderBy: PoolsOrderBy.TVL, ascending: false })
    expect(screen.getByTestId('outer-sort')).toHaveTextContent(`${PoolSortFields.Apr}:true`)
  })

  it('uses explicit fixture pages and their total and never enables the live request', async () => {
    fixtureState({ hasNextPage: true })
    const { rerender } = renderTable(true)

    expect(lastLiveRequest()?.enabled).toBe(false)
    expect(vi.mocked(useInfiniteQuery).mock.lastCall?.[0]).toMatchObject({ enabled: true })
    expect(screen.getByText(FIXTURE_POOL.id)).toBeInTheDocument()
    expect(screen.queryByText(POOL.id)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pools 12' })).toBeInTheDocument()
    act(() => tableProps()?.loadMore?.({}))
    expect(fixtureFetchNextPage).toHaveBeenCalledOnce()
    expect(fetchNextPage).not.toHaveBeenCalled()

    fixtureState({
      pages: [
        { pools: [FIXTURE_POOL], total: 12 },
        { pools: [{ ...FIXTURE_POOL, id: 'next-preview-pool' }], total: 12 },
      ],
    })
    rerender(<HookDetailsPoolsTable deployment={DEPLOYMENT} isFixture headingId="hook-pools-heading" />)
    expect(screen.getByText('next-preview-pool')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pools 12' })).toBeInTheDocument()
  })

  it('updates fixture query identity for the selected chain, exact address, period and sort', async () => {
    const { rerender } = renderTable(true)
    await userEvent.click(screen.getByRole('button', { name: 'Sort by TVL ascending' }))
    expect(vi.mocked(hookPoolsFixtureQueryOptions).mock.lastCall?.[0]).toMatchObject({
      chainId: DEPLOYMENT.chainId,
      hookAddress: DEPLOYMENT.address,
      period: TimePeriod.DAY,
      sortMethod: PoolSortFields.TVL,
      sortAscending: true,
    })
    exploreStore.setState({ timePeriod: TimePeriod.MONTH })
    rerender(<HookDetailsPoolsTable deployment={BASE_DEPLOYMENT} isFixture headingId="hook-pools-heading" />)
    expect(vi.mocked(hookPoolsFixtureQueryOptions).mock.lastCall?.[0]).toMatchObject({
      chainId: BASE_DEPLOYMENT.chainId,
      hookAddress: BASE_DEPLOYMENT.address,
      period: TimePeriod.MONTH,
      sortMethod: PoolSortFields.TVL,
      sortAscending: true,
    })
  })

  it('omits a live total even when the loaded page and raw row counts are known', () => {
    liveState({ pools: [POOL, { ...POOL, id: 'second-live-pool' }], rawPoolCount: 10 })
    renderTable()

    expect(screen.getByRole('heading', { name: 'Pools' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pools 2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pools 10' })).not.toBeInTheDocument()
  })

  it('renders the selected query loading state without showing cached rows from the other source', () => {
    fixtureState({ pages: [], isLoading: true })
    const { container } = renderTable(true)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(tableProps()?.loading).toBe(true)
    expect(screen.queryByText(POOL.id)).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('hooks.details.pools.empty'))).not.toBeInTheDocument()
  })

  it.each([false, true])(
    'retains rows in fixture mode %s while refreshing without pagination into old cursors',
    async (isFixture) => {
      if (isFixture) {
        fixtureState({ isFetching: true, isPlaceholderData: true, hasNextPage: true })
      } else {
        liveState({ isFetching: true, isPlaceholderData: true, hasNextPage: true })
      }
      const { container } = renderTable(isFixture)
      const pool = isFixture ? FIXTURE_POOL : POOL

      expect(screen.getByText(pool.id)).toBeInTheDocument()
      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
      expect(tableProps()?.loading).toBe(false)
      expect(tableProps()?.loadMore).toBeUndefined()
      expect(screen.queryByRole('button', { name: i18n.t('common.button.retry') })).not.toBeInTheDocument()
      expect(fixtureFetchNextPage).not.toHaveBeenCalled()
      expect(fetchNextPage).not.toHaveBeenCalled()
    },
  )

  it('omits the separate pool header and period selector on mobile', () => {
    vi.mocked(useMedia).mockReturnValue({ md: true } as ReturnType<typeof useMedia>)
    renderTable()

    expect(screen.queryByRole('heading', { name: 'Pools' })).not.toBeInTheDocument()
    expect(VolumeTimeFrameSelector).not.toHaveBeenCalled()
    expect(screen.getByText(POOL.id)).toBeInTheDocument()
  })

  it('keeps a live failure as an error and retries live data instead of falling back to cached fixture rows', () => {
    liveState({ pools: undefined, isError: true, isSuccess: false, error: new Error('request failed') })
    renderTable()

    expect(tableProps()).toMatchObject({
      error: true,
      loading: false,
      errorState: { onRetry: expect.any(Function) },
    })
    expect(screen.queryByText(FIXTURE_POOL.id)).not.toBeInTheDocument()
    tableProps()?.errorState?.onRetry?.()
    expect(refetch).toHaveBeenCalledOnce()
    expect(fixtureRefetch).not.toHaveBeenCalled()
  })

  it('retries a fixture failure through its own query and distinguishes an explicit zero total', () => {
    fixtureState({ pages: [], isError: true })
    const { rerender } = renderTable(true)

    expect(screen.queryByText(POOL.id)).not.toBeInTheDocument()
    expect(tableProps()?.error).toBe(true)
    tableProps()?.errorState?.onRetry?.()
    expect(fixtureRefetch).toHaveBeenCalledOnce()
    expect(refetch).not.toHaveBeenCalled()

    fixtureState({ pages: [{ pools: [], total: 0 }] })
    rerender(<HookDetailsPoolsTable deployment={DEPLOYMENT} isFixture headingId="hook-pools-heading" />)
    expect(screen.getByRole('heading', { name: 'Pools 0' })).toBeInTheDocument()
    expect(tableProps()).toMatchObject({
      pools: [],
      emptyState: { title: i18n.t('hooks.details.pools.empty') },
    })
    expect(screen.queryByText(POOL.id)).not.toBeInTheDocument()
  })

  it('shows an empty live result and still allows pagination when the backend has another cursor', async () => {
    liveState({ pools: [], rawPoolCount: 0, hasNextPage: true })
    renderTable()

    expect(tableProps()).toMatchObject({
      pools: [],
      emptyState: { title: i18n.t('hooks.details.pools.empty') },
    })
    act(() => tableProps()?.loadMore?.({}))
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it('keeps loaded rows after a pagination failure and retries the next page explicitly', async () => {
    liveState({ hasNextPage: true, isError: true, isFetchNextPageError: true })
    renderTable()

    expect(screen.getByText(POOL.id)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('hooks.details.pools.paginationError'))
    expect(tableProps()?.loadMore).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: i18n.t('common.button.retry') }))
    expect(fetchNextPage).toHaveBeenCalledOnce()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('retains rows after a background refresh error and retries that refresh rather than another page', async () => {
    liveState({ isError: true, hasNextPage: false })
    renderTable()

    expect(screen.getByText(POOL.id)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('hooks.details.pools.refreshError'))
    await userEvent.click(screen.getByRole('button', { name: i18n.t('common.button.retry') }))
    expect(refetch).toHaveBeenCalledOnce()
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('prevents duplicate manual pagination while a page is in flight', async () => {
    liveState({ hasNextPage: true, isFetchingNextPage: true })
    renderTable()
    expect(screen.queryByRole('button', { name: i18n.t('common.button.retry') })).not.toBeInTheDocument()
    act(() => tableProps()?.loadMore?.({}))
    expect(fetchNextPage).not.toHaveBeenCalled()
    expect(screen.getByText(POOL.id)).toBeInTheDocument()
  })
})
