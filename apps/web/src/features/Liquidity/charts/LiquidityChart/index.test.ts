import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useGetPool, useGetPoolsByTokens } from 'uniswap/src/data/apiClients/dataApiService/pools/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'
import { renderHook, waitFor } from '~/test-utils/render'
import { PositionField } from '~/types/position'

const { mockUseAllV3TicksQuery, mockUseAllV4TicksQuery } = vi.hoisted(() => ({
  mockUseAllV3TicksQuery: vi.fn(),
  mockUseAllV4TicksQuery: vi.fn(),
}))

vi.mock('@universe/api', async () => {
  const actual = await vi.importActual('@universe/api')
  return {
    ...actual,
    GraphQLApi: {
      ...(actual.GraphQLApi as Record<string, unknown>),
      useAllV3TicksQuery: mockUseAllV3TicksQuery,
      useAllV4TicksQuery: mockUseAllV4TicksQuery,
    },
  }
})

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPools', () => ({
  useGetPool: vi.fn(),
  useGetPoolsByTokens: vi.fn(),
}))

const useGetPoolsByTokensMock = vi.mocked(useGetPoolsByTokens)

const POOL_ID = '0x0000000000000000000000000000000000000003'
const SDK_CURRENCIES = { [PositionField.TOKEN0]: TEST_TOKEN_1, [PositionField.TOKEN1]: TEST_TOKEN_2 }

type PoolsQueryResult = ReturnType<typeof useGetPoolsByTokens>

function mockPoolsQuery({ pools, isLoading = false }: { pools?: Record<string, unknown>[]; isLoading?: boolean }) {
  useGetPoolsByTokensMock.mockReturnValue({
    data: pools ? { pools } : undefined,
    isLoading,
  } as unknown as PoolsQueryResult)
  // Every case here renders with a `poolId`, so `usePoolActiveLiquidity` reads the row via `GetPool`.
  vi.mocked(useGetPool).mockReturnValue({
    data: pools?.[0] ? { pool: pools[0] } : undefined,
    isLoading,
  } as unknown as ReturnType<typeof useGetPool>)
}

function poolRow(overrides: Record<string, unknown> = {}) {
  return {
    poolId: POOL_ID,
    liquidity: '1000000000000000000',
    sqrtPriceX96: '79228162514264337593543950336',
    tick: 0,
    tickSpacing: 60,
    ...overrides,
  }
}

function mockTicksQuery({
  ticks,
  loading = false,
  version = ProtocolVersion.V3,
}: {
  ticks?: { tick: number; liquidityNet: string }[]
  loading?: boolean
  version?: ProtocolVersion
}) {
  const key = version === ProtocolVersion.V4 ? 'v4Pool' : 'v3Pool'
  const result = { data: ticks ? { [key]: { ticks } } : undefined, loading, error: undefined }
  mockUseAllV3TicksQuery.mockReturnValue(result)
  mockUseAllV4TicksQuery.mockReturnValue(result)
}

// Brackets the active tick (0) so `usePoolActiveLiquidity` finds a pivot.
function bracketingTicks(spacing: number) {
  return [
    { tick: -spacing, liquidityNet: '1000000000000000000' },
    { tick: spacing, liquidityNet: '-1000000000000000000' },
  ]
}

function renderBarData(overrides: Record<string, unknown> = {}) {
  return renderHook(() =>
    useLiquidityBarData({
      sdkCurrencies: SDK_CURRENCIES,
      feeTier: FeeAmount.MEDIUM,
      isReversed: false,
      chainId: UniverseChainId.Mainnet,
      version: ProtocolVersion.V3,
      poolId: POOL_ID,
      ...overrides,
    }),
  )
}

describe('useLiquidityBarData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports loading while the source is still fetching', () => {
    mockPoolsQuery({ isLoading: true })
    mockTicksQuery({ loading: true })

    const { result } = renderBarData()

    expect(result.current.loading).toBe(true)
    expect(result.current.tickData).toBeUndefined()
  })

  it('settles with an empty result when the ticks query returns no ticks', async () => {
    mockPoolsQuery({ pools: [poolRow()] })
    mockTicksQuery({ ticks: [] })

    const { result } = renderBarData()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickData?.barData).toEqual([])
  })

  it('settles with an empty result when no tick spacing can be resolved for a v4 pool', async () => {
    // v4 tick spacing is arbitrary per pool: absent from the pool row and not derivable from this fee.
    mockPoolsQuery({ pools: [poolRow({ tickSpacing: undefined })] })
    mockTicksQuery({ ticks: bracketingTicks(10), version: ProtocolVersion.V4 })

    const { result } = renderBarData({ version: ProtocolVersion.V4, feeTier: 4000, hooks: undefined })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickData?.barData).toEqual([])
  })

  it('builds bars for a v4 pool whose tick spacing comes only from the pool data', async () => {
    mockPoolsQuery({ pools: [poolRow({ tickSpacing: 10 })] })
    mockTicksQuery({ ticks: bracketingTicks(10), version: ProtocolVersion.V4 })

    const { result } = renderBarData({ version: ProtocolVersion.V4, feeTier: 4000 })

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))
    expect(result.current.loading).toBe(false)
  })

  it('builds bars on the success path', async () => {
    mockPoolsQuery({ pools: [poolRow()] })
    mockTicksQuery({ ticks: bracketingTicks(60) })

    const { result } = renderBarData()

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))
    expect(result.current.loading).toBe(false)
    expect(result.current.activeTick).toBe(0)
  })
})
