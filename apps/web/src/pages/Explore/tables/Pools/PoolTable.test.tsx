import '~/test-utils/tokens/mocks'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { buildHookRegistryMap, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import {
  EMPTY_EXPLORE_POOLS_FILTER_STATE,
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
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

/** A mainnet pool row with just enough shape to render; override what a test cares about. */
function poolStat(overrides: Partial<PoolStat>): PoolStat {
  return {
    id: '1',
    chain: 'mainnet',
    token0: validRestPoolToken0,
    token1: validRestPoolToken1,
    feeTier: { feeAmount: 500, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false },
    txCount: 1,
    totalLiquidity: { value: 1 },
    volume1Day: { value: 1 },
    volume30Day: { value: 1 },
    apr: 1,
    volOverTvl: 1,
    protocolVersion: GraphQLApi.ProtocolVersion.V3,
    ...overrides,
  } as unknown as PoolStat
}

vi.mock('~/pages/Explore/hooks/useListPools')
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

describe('PoolTable', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
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

  it('renders data filled state', () => {
    const hookAddress = '0x0010d0d5db05933fa0d9f7038d365e1541a41888'
    const mockData = [
      {
        id: '1',
        chain: 'mainnet',
        token0: validRestPoolToken0,
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
        protocolVersion: GraphQLApi.ProtocolVersion.V3,
      },
      {
        id: '2',
        chain: 'mainnet',
        token0: validRestPoolToken0,
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
        protocolVersion: GraphQLApi.ProtocolVersion.V4,
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
    // validRestPoolToken0 is on ETHEREUM, so rows resolve to Mainnet (chainId 1)
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
    expect(asFragment()).toMatchSnapshot()

    // The dialog's extra details are not rendered until the hook name is clicked
    expect(screen.queryByText('Adjusts LP fees dynamically')).toBeNull()
    fireEvent.click(screen.getAllByText('TestHook')[0])
    expect(screen.getByText('Adjusts LP fees dynamically')).toBeTruthy()
  })

  it('loads the full cross-chain hook registry when a hooked list is not filtered to a chain', () => {
    mocked(useListPools).mockReturnValue({
      pools: [poolStat({ id: '1', protocolVersion: GraphQLApi.ProtocolVersion.V4, hookAddress: HOOKED_ADDRESS })],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    renderWithProvider(<ExploreTopPoolTable surface="explore" />)

    expect(mocked(useHookRegistryMap)).toHaveBeenCalledWith({ chainId: undefined, enabled: true })
  })

  it('scopes the pools query to the URL chain with advanced filtering on', () => {
    // The advanced filter's Network control reads and writes the URL chain segment, so a direct link like
    // /explore/pools/ethereum must filter the table just as it does with the flag off. The chain travels on
    // the `chainId` arg with `poolsFilter.chainId` unset; resolvePoolsListChainId (getPoolsListParams.test.ts)
    // covers that the surface chain then scopes the request.
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AdvancedPoolsFiltering)
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
      pools: [poolStat({ id: '1', protocolVersion: GraphQLApi.ProtocolVersion.V4, hookAddress: HOOKED_ADDRESS })],
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
        poolStat({ id: '1', protocolVersion: GraphQLApi.ProtocolVersion.V3 }),
        // a v4 pool with no hook reports the zero address, which must not count as hooked
        poolStat({ id: '2', protocolVersion: GraphQLApi.ProtocolVersion.V4, hookAddress: ZERO_ADDRESS }),
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
      pools: [poolStat({ protocolVersion: GraphQLApi.ProtocolVersion.V3 })],
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
          protocolVersion: GraphQLApi.ProtocolVersion.V4,
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
        chain: 'mainnet',
        token0: validRestPoolToken0,
        token1: validRestPoolToken1,
        feeTier: { feeAmount: 3000, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false },
        txCount: 200,
        totalLiquidity: { value: 300 },
        volume1Day: { value: 400 },
        volume30Day: { value: 500 },
        apr: 6,
        volOverTvl: 1.84,
        protocolVersion: GraphQLApi.ProtocolVersion.V4,
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
    // ('v4'), so comparing against the GraphQL enum's 'V4' never matched in production — every v4 row
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
      protocolVersion: GraphQLApi.ProtocolVersion,
      // Per-pool protocol fee (integer pips) as the data hook attaches it to each pool; the
      // fee-display column reads it straight off `pool.protocolFeePips`.
      served: { protocolFee?: number } = {},
    ) {
      const pool = {
        id: '1',
        chain: 'mainnet',
        token0: validRestPoolToken0,
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
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V4)
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      // FeeDisplay renders the fee standalone next to the version, not as the joined "v4 · 0.30%" text.
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v4 · /)).toBeNull()
    })

    it('keeps the Dynamic label for dynamic fee tiers instead of rendering the sentinel as a fee', () => {
      mockPools({ feeAmount: DYNAMIC_FEE_AMOUNT, isDynamic: true }, GraphQLApi.ProtocolVersion.V4)
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText(/^v4 · Dynamic/).length).toBeGreaterThan(0)
      // DYNAMIC_FEE_AMOUNT (8388608 pips) must never be formatted as a rate (~838%).
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('renders the v2 fee through FeeDisplay', () => {
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V2)
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v2 · /)).toBeNull()
    })

    it('feeds the backend-served protocol fee (pips) to the engine as bps and gets a served breakdown', () => {
      mocked(getFeeBreakdown).mockClear()
      // 500 pips = 5 bps served for a 30 bps v4 pool.
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V4, { protocolFee: 500 })
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
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V4)
      renderWithProvider(<ExploreTopPoolTable surface="explore" />)
      expect(getFeeBreakdown).toHaveBeenCalledWith(expect.objectContaining({ servedProtocolFeeBps: undefined }))
      // Unavailable: every breakdown has an undefined protocol fee; the served path never runs.
      const protocolFees = mocked(getFeeBreakdown).mock.results.map((result) => result.value.protocolFeeBps)
      expect(protocolFees.length).toBeGreaterThan(0)
      expect(protocolFees.every((bps) => bps === undefined)).toBe(true)
    })
  })
})
