import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount } from '@uniswap/v3-sdk'
import { PropsWithChildren } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePoolActiveLiquidity } from '~/features/Liquidity/hooks/usePoolTickData'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

const POOL_ID = '0xabc0000000000000000000000000000000000000000000000000000000000001'
const V3_POOL_ADDRESS = '0x0000000000000000000000000000000000000abc'

// Static fee tier the UI asks for. The pool's live (protocol) fee differs, which is why a
// fee-filtered ListPools returns no rows for it.
const STATIC_FEE_TIER = FeeAmount.MEDIUM
// Deliberately not TICK_SPACINGS[MEDIUM] (60), so a tick spacing of 60 can only have come from
// the fee-tier fallback and never from the pool row.
const TICK_SPACING = 10
const FEE_TIER_DEFAULT_TICK_SPACING = 60
const CURRENT_TICK = 130

type PoolRow = {
  poolId: string
  tick: number
  liquidity: string
  sqrtPriceX96: string
  tickSpacing: number
  fee: number
  protocolVersion: ProtocolVersion
}

const transportState = vi.hoisted(() => ({
  listPoolsRows: [] as unknown[],
  poolById: undefined as unknown,
  listPoolsRequests: [] as { fee?: number }[],
  getPoolRequests: [] as { poolId?: string; chainId?: number; protocolVersion?: number }[],
}))

vi.mock('uniswap/src/data/transport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/transport')>()
  const { createRouterTransport } = await import('@connectrpc/connect')
  const { DataApiService } = await import('@uniswap/client-data-api/dist/data/v1/api_connect')

  const transport = createRouterTransport(({ service }) => {
    service(DataApiService, {
      listPools: (req: unknown) => {
        transportState.listPoolsRequests.push(req as { fee?: number })
        return { pools: transportState.listPoolsRows } as never
      },
      getPool: (req: unknown) => {
        transportState.getPoolRequests.push(req as { poolId?: string })
        return { pool: transportState.poolById } as never
      },
    })
  })

  return { ...actual, uniswapGetTransport: transport, uniswapPostTransport: transport }
})

// chainId is always passed explicitly below, so the ambient default is unused.
vi.mock('~/state/multichain/useMultichainContext', () => ({
  useMultichainContext: () => ({ chainId: undefined, isMultichainContext: false }),
}))

// Tick rows come from the GraphQL indexer, a separate source from the pool row under test.
const tickRows = [
  { tick: 0, liquidityNet: '1000' },
  { tick: 60, liquidityNet: '2000' },
  { tick: 120, liquidityNet: '3000' },
  { tick: 180, liquidityNet: '-2000' },
  { tick: 240, liquidityNet: '-1000' },
]

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useAllV3TicksQuery: vi.fn(({ skip }: { skip?: boolean }) => ({
        data: skip ? undefined : { v3Pool: { ticks: tickRows } },
        loading: false,
        error: undefined,
      })),
      useAllV4TicksQuery: vi.fn(({ skip }: { skip?: boolean }) => ({
        data: skip ? undefined : { v4Pool: { ticks: tickRows } },
        loading: false,
        error: undefined,
      })),
    },
  }
})

function poolRow(overrides: Partial<PoolRow> = {}): PoolRow {
  return {
    poolId: POOL_ID,
    tick: CURRENT_TICK,
    liquidity: '5000000',
    sqrtPriceX96: '79228162514264337593543950336',
    tickSpacing: TICK_SPACING,
    // Live protocol fee, deliberately different from STATIC_FEE_TIER.
    fee: 100,
    protocolVersion: ProtocolVersion.V4,
    ...overrides,
  }
}

const sdkCurrencies = { TOKEN0: TEST_TOKEN_1, TOKEN1: TEST_TOKEN_2 }

// A fresh client per test: no retry backoff on failures, and no result cached across cases.
function renderPoolActiveLiquidity(args: Parameters<typeof usePoolActiveLiquidity>[0]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => usePoolActiveLiquidity(args), { wrapper })
}

describe('usePoolActiveLiquidity', () => {
  beforeEach(() => {
    transportState.listPoolsRows = []
    transportState.poolById = undefined
    transportState.listPoolsRequests = []
    transportState.getPoolRequests = []
  })

  it('resolves tick data for a v4 pool whose live fee differs from the requested fee tier', async () => {
    // The fee-filtered list read finds nothing for this pool...
    transportState.listPoolsRows = []
    // ...but the pool-id keyed read returns it.
    transportState.poolById = poolRow()

    const { result } = renderPoolActiveLiquidity({
      sdkCurrencies,
      feeAmount: STATIC_FEE_TIER,
      version: ProtocolVersion.V4,
      chainId: UniverseChainId.Mainnet,
      poolId: POOL_ID,
    })

    // currentTick can only come from the pool row, so this gates on the pool actually resolving.
    await waitFor(() => expect(result.current.currentTick).toBe(CURRENT_TICK), { timeout: 5000 })

    expect(result.current.tickSpacing).toBe(TICK_SPACING)
    expect(result.current.activeTick).toBe(130)
    expect(result.current.liquidity?.toString()).toBe('5000000')
    expect(result.current.data?.length).toBeGreaterThan(0)

    // GetPool is keyed on the pool id and carries no fee filter.
    expect(transportState.getPoolRequests).toHaveLength(1)
    expect(transportState.getPoolRequests[0]).toMatchObject({
      poolId: POOL_ID,
      chainId: UniverseChainId.Mainnet,
      protocolVersion: ProtocolVersion.V4,
    })
    expect(transportState.listPoolsRequests).toHaveLength(0)
  })

  it('resolves tick data for a v3 pool addressed by pool address', async () => {
    transportState.poolById = poolRow({
      poolId: V3_POOL_ADDRESS,
      protocolVersion: ProtocolVersion.V3,
      fee: STATIC_FEE_TIER,
    })

    const { result } = renderPoolActiveLiquidity({
      sdkCurrencies,
      feeAmount: STATIC_FEE_TIER,
      version: ProtocolVersion.V3,
      chainId: UniverseChainId.Mainnet,
      poolId: V3_POOL_ADDRESS,
    })

    await waitFor(() => expect(result.current.currentTick).toBe(CURRENT_TICK), { timeout: 5000 })

    expect(result.current.tickSpacing).toBe(TICK_SPACING)
    expect(result.current.activeTick).toBe(130)
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(transportState.getPoolRequests[0]).toMatchObject({
      poolId: V3_POOL_ADDRESS,
      protocolVersion: ProtocolVersion.V3,
    })
  })

  it('falls back to the token-pair list read when no pool id is known (create flow)', async () => {
    transportState.listPoolsRows = [poolRow({ fee: STATIC_FEE_TIER })]

    const { result } = renderPoolActiveLiquidity({
      sdkCurrencies,
      feeAmount: STATIC_FEE_TIER,
      version: ProtocolVersion.V4,
      chainId: UniverseChainId.Mainnet,
      // Create flow supplies tickSpacing from form state and has no pool id yet.
      tickSpacing: TICK_SPACING,
      hooks: ZERO_ADDRESS,
    })

    await waitFor(() => expect(transportState.listPoolsRequests).toHaveLength(1), { timeout: 5000 })
    await waitFor(() => expect(result.current.currentTick).toBe(CURRENT_TICK), { timeout: 5000 })

    expect(transportState.getPoolRequests).toHaveLength(0)
    expect(result.current.tickSpacing).toBe(TICK_SPACING)
    expect(result.current.activeTick).toBe(130)
  })

  it('treats an absent (zero) tick_spacing as missing and falls back to the fee tier default', async () => {
    // proto3 non-optional int32: an unset tick_spacing arrives as 0.
    transportState.poolById = poolRow({ tickSpacing: 0 })

    const { result } = renderPoolActiveLiquidity({
      sdkCurrencies,
      feeAmount: STATIC_FEE_TIER,
      version: ProtocolVersion.V4,
      chainId: UniverseChainId.Mainnet,
      poolId: POOL_ID,
    })

    await waitFor(() => expect(result.current.currentTick).toBe(CURRENT_TICK), { timeout: 5000 })

    expect(result.current.tickSpacing).toBe(FEE_TIER_DEFAULT_TICK_SPACING)
    expect(result.current.activeTick).toBe(120)
  })
})
