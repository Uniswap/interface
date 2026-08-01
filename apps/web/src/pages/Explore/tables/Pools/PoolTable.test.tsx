import '~/test-utils/tokens/mocks'
import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { getProtocolFeesQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { buildHookRegistryMap, useHookRegistryMap } from '~/hooks/useHookRegistryMap'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { mocked } from '~/test-utils/mocked'
import { validRestPoolToken0, validRestPoolToken1 } from '~/test-utils/pools/fixtures'
import { fireEvent, render, screen } from '~/test-utils/render'

function renderWithProvider(ui: React.ReactElement) {
  return render(<ExploreTablesFilterStoreContextProvider>{ui}</ExploreTablesFilterStoreContextProvider>)
}

const { getProtocolFeesQueryOptions: actualGetProtocolFeesQueryOptions } = await vi.importActual<
  typeof import('uniswap/src/data/apiClients/dataApiService/pools/queries')
>('uniswap/src/data/apiClients/dataApiService/pools/queries')

vi.mock('~/features/Explore/state/topPools/useTopPools')
// Passthrough spy: real engine behavior, observable inputs/outputs.
vi.mock('uniswap/src/features/fees/getFeeBreakdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/fees/getFeeBreakdown')>()
  return { ...actual, getFeeBreakdown: vi.fn(actual.getFeeBreakdown) }
})
// The table fetches fees via batched GetProtocolFees (ListTopPools serves none) — spy the query
// layer so tests can serve per-pool fees synchronously through initialData.
vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/pools/queries')>()
  return { ...actual, getProtocolFeesQueryOptions: vi.fn(actual.getProtocolFeesQueryOptions) }
})
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('~/hooks/useHookRegistryMap', async () => {
  const actual = await vi.importActual('~/hooks/useHookRegistryMap')
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
    mocked(useTopPools).mockReturnValue({
      isLoading: true,
      isError: false,
      topPools: [],
      topBoostedPools: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable />)
    expect(screen.getAllByTestId('cell-loading-bubble')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders error state', () => {
    mocked(useTopPools).mockReturnValue({
      isLoading: false,
      isError: true,
      topPools: [],
      topBoostedPools: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
    })

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable />)
    expect(screen.getByTestId('table-error-modal')).not.toBeNull()
    expect(asFragment()).toMatchSnapshot()
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
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        apr: new Percent(6, 100),
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
        hash: '0x456',
        txCount: 100,
        tvl: 200,
        volume24h: 300,
        volumeWeek: 400,
        apr: new Percent(4, 100),
        volOverTvl: 1.5,
        protocolVersion: GraphQLApi.ProtocolVersion.V4,
        hookAddress,
      },
    ]
    mocked(useTopPools).mockReturnValue({
      topPools: mockData,
      topBoostedPools: mockData,
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      loadMore: vi.fn(),
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

    const { asFragment } = renderWithProvider(<ExploreTopPoolTable />)
    expect(screen.getByTestId('top-pools-explore-table')).not.toBeNull()
    // Protocol, fee tier, and hook info collapse into the Pool column's second line — no
    // standalone columns for them
    expect(screen.queryByText('Protocol')).toBeNull()
    expect(screen.queryByText('Fee tier')).toBeNull()
    expect(screen.queryByText('Hook')).toBeNull()
    expect(screen.getAllByText(/^v3 · /).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^v4 · /).length).toBeGreaterThan(0)
    // The v4 pool's hook resolves to its registry name as plain text; the v3 pool shows no hook
    expect(screen.getAllByText('TestHook').length).toBeGreaterThan(0)
    expect(asFragment()).toMatchSnapshot()

    // The dialog's extra details are not rendered until the hook name is clicked
    expect(screen.queryByText('Adjusts LP fees dynamically')).toBeNull()
    fireEvent.click(screen.getAllByText('TestHook')[0])
    expect(screen.getByText('Adjusts LP fees dynamically')).toBeTruthy()
  })

  describe('with V4ProtocolFeeDisplay enabled', () => {
    let feeQueryNonce = 0

    function mockPools(
      feeTier: { feeAmount: number; isDynamic: boolean },
      protocolVersion: GraphQLApi.ProtocolVersion,
      // Per-pool fee served through the mocked GetProtocolFees query (integer pips) — the pool
      // objects themselves never carry fees (ListTopPools serves none).
      served: { protocolFee?: number } = {},
    ) {
      // Serve the requested fee synchronously via initialData: every requested pool id echoes
      // back with the given protocolFee, or with both fields absent (= unavailable on the wire).
      feeQueryNonce += 1
      const nonce = feeQueryNonce
      mocked(getProtocolFeesQueryOptions).mockImplementation((input) => {
        const poolIds = input.params?.poolIds ?? []
        return {
          // The nonce pool id salts the query key: the shared test QueryClient would otherwise
          // serve a previous test's cached response for an identical request shape, ignoring
          // this test's initialData.
          ...actualGetProtocolFeesQueryOptions({
            ...input,
            params: { ...input.params, poolIds: [...poolIds, `__nonce-${nonce}`] },
          }),
          enabled: false,
          initialData: {
            protocolFees: poolIds.map((poolId) => ({
              poolId,
              protocolFee: served.protocolFee,
              effectiveFee:
                served.protocolFee !== undefined
                  ? protocolVersion === GraphQLApi.ProtocolVersion.V4
                    ? feeTier.feeAmount + served.protocolFee
                    : feeTier.feeAmount
                  : undefined,
            })),
          },
        }
      })
      const pool = {
        id: '1',
        chain: 'mainnet',
        token0: validRestPoolToken0,
        token1: validRestPoolToken1,
        feeTier: { ...feeTier, tickSpacing: DEFAULT_TICK_SPACING },
        hash: '0x123',
        txCount: 200,
        tvl: 300,
        volume24h: 400,
        volumeWeek: 500,
        apr: new Percent(6, 100),
        volOverTvl: 1.84,
        protocolVersion,
      }
      mocked(useTopPools).mockReturnValue({
        topPools: [pool],
        topBoostedPools: [pool],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        loadMore: vi.fn(),
      })
    }

    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.V4ProtocolFeeDisplay)
    })

    it('renders a FeeDisplay for a static v4 fee tier', () => {
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V4)
      renderWithProvider(<ExploreTopPoolTable />)
      // FeeDisplay renders the fee standalone next to the version, not as the joined "v4 · 0.30%" text.
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v4 · /)).toBeNull()
    })

    it('keeps the Dynamic label for dynamic fee tiers instead of rendering the sentinel as a fee', () => {
      mockPools({ feeAmount: DYNAMIC_FEE_AMOUNT, isDynamic: true }, GraphQLApi.ProtocolVersion.V4)
      renderWithProvider(<ExploreTopPoolTable />)
      expect(screen.getAllByText(/^v4 · Dynamic/).length).toBeGreaterThan(0)
      // DYNAMIC_FEE_AMOUNT (8388608 pips) must never be formatted as a rate (~838%).
      expect(screen.queryByText(/838/)).toBeNull()
    })

    it('renders the v2 fee through FeeDisplay', () => {
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V2)
      renderWithProvider(<ExploreTopPoolTable />)
      expect(screen.getAllByText('0.30%').length).toBeGreaterThan(0)
      expect(screen.queryByText(/^v2 · /)).toBeNull()
    })

    it('feeds the backend-served protocol fee (pips) to the engine as bps and gets a served breakdown', () => {
      mocked(getFeeBreakdown).mockClear()
      // 500 pips = 5 bps served for a 30 bps v4 pool.
      mockPools({ feeAmount: 3000, isDynamic: false }, GraphQLApi.ProtocolVersion.V4, { protocolFee: 500 })
      renderWithProvider(<ExploreTopPoolTable />)
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
      renderWithProvider(<ExploreTopPoolTable />)
      expect(getFeeBreakdown).toHaveBeenCalledWith(expect.objectContaining({ servedProtocolFeeBps: undefined }))
      // Unavailable: every breakdown has an undefined protocol fee; the served path never runs.
      const protocolFees = mocked(getFeeBreakdown).mock.results.map((result) => result.value.protocolFeeBps)
      expect(protocolFees.length).toBeGreaterThan(0)
      expect(protocolFees.every((bps) => bps === undefined)).toBe(true)
    })
  })
})
