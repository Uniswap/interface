import { renderHook } from '@testing-library/react'
import { PoolProtocol } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { useLiquidityServicePoolVolumeChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolVolumeChartData'

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: mockUseQuery,
}))

// Pass the input through so tests can assert on the params/enabled the hook builds.
vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', () => ({
  liquidityQueries: { getPoolHistoryVolume: (input: unknown): unknown => input },
}))

const POOL_ID = '0x2b21c65d9a7dc6926ee330a1c6e5a8037fd81774f3dc066536f800128e39f634'

const variables = {
  addressOrId: POOL_ID,
  chainId: UniverseChainId.Mainnet,
  duration: HistoryDuration.Day,
  isV2: false,
  isV3: false,
  isV4: true,
}

/** The `{ params, enabled }` input the hook handed to `liquidityQueries.getPoolHistoryVolume`. */
function capturedQueryInput(): {
  params?: { pool?: { addressOrId: string; version: PoolProtocol } }
  enabled: boolean
} {
  return mockUseQuery.mock.calls[0][0]
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
})

describe('useLiquidityServicePoolVolumeChartData', () => {
  it('requests the pool history for the protocol version the vars name', () => {
    renderHook(() => useLiquidityServicePoolVolumeChartData({ variables }))

    const { params, enabled } = capturedQueryInput()
    expect(enabled).toBe(true)
    expect(params?.pool?.addressOrId).toBe(POOL_ID)
    expect(params?.pool?.version).toBe(PoolProtocol.V4)
  })

  // The tooltip shows what the bucket's swaps actually paid, so the served figure rides along with
  // the volume instead of being re-derived from a fee rate.
  it('carries each bucket served feeUsd onto the bar as feesUsd', () => {
    mockUseQuery.mockReturnValue({
      data: {
        buckets: [
          { timestamp: 1_700_000_000n, volumeUsd: 1_400, feeUsd: 0.7 },
          { timestamp: 1_700_003_600n, volumeUsd: 2_000, feeUsd: 0 },
        ],
      },
      isLoading: false,
    })

    const { result } = renderHook(() => useLiquidityServicePoolVolumeChartData({ variables }))

    expect(result.current.entries).toEqual([
      { value: 1_400, feesUsd: 0.7, time: 1_700_000_000 },
      { value: 2_000, feesUsd: 0, time: 1_700_003_600 },
    ])
  })

  it('does not query when disabled or when no protocol version is known', () => {
    renderHook(() => useLiquidityServicePoolVolumeChartData({ variables, disabled: true }))
    expect(capturedQueryInput().enabled).toBe(false)

    vi.clearAllMocks()
    renderHook(() =>
      useLiquidityServicePoolVolumeChartData({ variables: { ...variables, isV4: false, isV3: false, isV2: false } }),
    )
    expect(capturedQueryInput().enabled).toBe(false)
    expect(capturedQueryInput().params).toBeUndefined()
  })
})
