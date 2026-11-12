import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { PoolSummary } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { FeeAmount } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'
import { renderHook, waitFor } from '~/test-utils/render'
import { PositionField } from '~/types/position'

// usePoolActiveLiquidity reads the pool + ticks from the liquidity service; mock both hooks so the
// bar-building logic under test gets deterministic inputs.
const { mockUseLiquidityServiceGetPool, mockUseLiquidityServicePoolTicks } = vi.hoisted(() => ({
  mockUseLiquidityServiceGetPool: vi.fn(),
  mockUseLiquidityServicePoolTicks: vi.fn(),
}))

vi.mock('~/features/Liquidity/hooks/useLiquidityServiceGetPool', () => ({
  useLiquidityServiceGetPool: mockUseLiquidityServiceGetPool,
}))

vi.mock('~/features/Liquidity/hooks/useLiquidityServicePoolTicks', () => ({
  useLiquidityServicePoolTicks: mockUseLiquidityServicePoolTicks,
}))

const POOL_ID = '0x0000000000000000000000000000000000000003'
const SDK_CURRENCIES = { [PositionField.TOKEN0]: TEST_TOKEN_1, [PositionField.TOKEN1]: TEST_TOKEN_2 }

function lsPool(overrides: Partial<ConstructorParameters<typeof PoolSummary>[0]> = {}): PoolSummary {
  return new PoolSummary({
    poolIdentifier: POOL_ID,
    chainId: UniverseChainId.Mainnet,
    protocolVersion: Protocols.V3,
    token0Address: TEST_TOKEN_1.address,
    token1Address: TEST_TOKEN_2.address,
    feeTier: FeeAmount.MEDIUM,
    tickSpacing: 60,
    currentTick: 0,
    sqrtPriceX96: '79228162514264337593543950336',
    liquidity: '1000000000000000000',
    ...overrides,
  })
}

function mockPool({ pool, isLoading = false }: { pool?: PoolSummary; isLoading?: boolean }) {
  mockUseLiquidityServiceGetPool.mockReturnValue({ data: pool ? { pool } : undefined, isLoading })
}

function mockTicks({
  ticks,
  loading = false,
}: {
  ticks?: { tick: number; liquidityNet: string }[]
  loading?: boolean
}) {
  mockUseLiquidityServicePoolTicks.mockReturnValue({ isLoading: loading, error: undefined, ticks })
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
    mockPool({})
    mockTicks({})
  })

  it('reports loading while the source is still fetching', () => {
    mockPool({ isLoading: true })
    mockTicks({ loading: true })

    const { result } = renderBarData()

    expect(result.current.loading).toBe(true)
    expect(result.current.tickData).toBeUndefined()
  })

  it('settles with an empty result when the ticks query returns no ticks', async () => {
    mockPool({ pool: lsPool() })
    mockTicks({ ticks: [] })

    const { result } = renderBarData()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickData?.barData).toEqual([])
  })

  it('settles with an empty result when no tick spacing can be resolved for a v4 pool', async () => {
    // v4 tick spacing is arbitrary per pool: absent from the pool row and not derivable from this fee.
    mockPool({ pool: lsPool({ protocolVersion: Protocols.V4, tickSpacing: undefined }) })
    mockTicks({ ticks: bracketingTicks(10) })

    const { result } = renderBarData({ version: ProtocolVersion.V4, feeTier: 4000, hooks: undefined })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickData?.barData).toEqual([])
  })

  it('builds bars for a v4 pool whose tick spacing comes only from the pool data', async () => {
    mockPool({ pool: lsPool({ protocolVersion: Protocols.V4, tickSpacing: 10 }) })
    mockTicks({ ticks: bracketingTicks(10) })

    const { result } = renderBarData({ version: ProtocolVersion.V4, feeTier: 4000 })

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))
    expect(result.current.loading).toBe(false)
  })

  it('builds bars on the success path', async () => {
    mockPool({ pool: lsPool() })
    mockTicks({ ticks: bracketingTicks(60) })

    const { result } = renderBarData()

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))
    expect(result.current.loading).toBe(false)
    expect(result.current.activeTick).toBe(0)
  })

  it('builds bars for a v2 pool from reserves, with no pool row and no ticks query', async () => {
    // v2 has neither a liquidity-service pool row nor an indexed tick list.
    mockPool({})
    mockTicks({})

    const { result } = renderBarData({
      version: ProtocolVersion.V2,
      feeTier: V2_DEFAULT_FEE_TIER,
      v2Reserves: { reserve0: 1000, reserve1: 2000 },
    })

    await waitFor(() => expect(result.current.tickData?.barData.length).toBeGreaterThan(0))
    expect(result.current.loading).toBe(false)
    expect(result.current.activeTick).toBe(6900)

    const { barData } = result.current.tickData!
    // Uniform L is the whole point: every bar is the same height.
    expect(new Set(barData.map((b) => b.liquidity)).size).toBe(1)
  })
})
