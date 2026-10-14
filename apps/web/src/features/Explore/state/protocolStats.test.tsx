import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { GetProtocolStatsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { vi } from 'vitest'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { render, screen } from '~/test-utils/render'

const mockUseGetProtocolStatsQuery = vi.fn()
vi.mock('uniswap/src/data/apiClients/dataApiService/explore/useGetProtocolStatsQuery', async (importOriginal) => ({
  ...(await importOriginal()),
  useGetProtocolStatsQuery: (params: unknown) => mockUseGetProtocolStatsQuery(params),
}))

const mockProtocolStatsData = {
  stats: { tvl: 1800, volume1d: 900, tvlChange1d: 12.5, volumeChange1d: -3.25 },
  protocolVersionStats: [
    { protocolVersion: ProtocolVersion.V2, stats: { tvl: 500, volume1d: 200, tvlChange1d: 1.5, volumeChange1d: 2 } },
    { protocolVersion: ProtocolVersion.V3, stats: { tvl: 600, volume1d: 300, tvlChange1d: -4, volumeChange1d: 3 } },
    { protocolVersion: ProtocolVersion.V4, stats: { tvl: 700, volume1d: 400, tvlChange1d: 20, volumeChange1d: 4 } },
  ],
} as unknown as GetProtocolStatsResponse

const defaultMockQueryResult = {
  data: mockProtocolStatsData,
  isLoading: false,
  isError: false,
  error: null,
}

const TestComponent24hProtocolVolume = () => {
  const result = use24hProtocolVolume()
  return <div data-testid="result-24h">{JSON.stringify(result)}</div>
}

const TestComponent24HrTVL = () => {
  const result = useDailyTVLWithChange()
  return <div data-testid="result-tvl">{JSON.stringify(result)}</div>
}

beforeEach(() => {
  mockUseGetProtocolStatsQuery.mockClear().mockReturnValue(defaultMockQueryResult)
})

describe('use24hProtocolVolume', () => {
  it('reads totals, per-protocol volume and the server-computed change', () => {
    render(<TestComponent24hProtocolVolume />)
    const result = JSON.parse(screen.getByTestId('result-24h').textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalVolume).toBe(900)
    expect(result.totalChangePercent).toBe(-3.25)
    expect(result.protocolVolumes).toEqual({ v2: 200, v3: 300, v4: 400 })
  })

  it('always requests every enabled chain', () => {
    render(<TestComponent24hProtocolVolume />)

    const params = mockUseGetProtocolStatsQuery.mock.lastCall![0] as { chainIds: UniverseChainId[] }
    expect(params.chainIds.length).toBeGreaterThan(0)
  })

  it('leaves the change undefined and volumes at 0 when the response omits them', () => {
    mockUseGetProtocolStatsQuery.mockReturnValue({
      ...defaultMockQueryResult,
      data: { stats: { tvl: 10, volume1d: 5 }, protocolVersionStats: [] } as unknown as GetProtocolStatsResponse,
    })

    render(<TestComponent24hProtocolVolume />)
    const result = JSON.parse(screen.getByTestId('result-24h').textContent || '{}')

    expect(result.totalVolume).toBe(5)
    expect(result.totalChangePercent).toBeUndefined()
    expect(result.protocolVolumes).toEqual({ v2: 0, v3: 0, v4: 0 })
  })

  it('reports zeros while loading', () => {
    mockUseGetProtocolStatsQuery.mockReturnValue({ ...defaultMockQueryResult, data: undefined, isLoading: true })

    render(<TestComponent24hProtocolVolume />)
    const result = JSON.parse(screen.getByTestId('result-24h').textContent || '{}')

    expect(result.isLoading).toBe(true)
    expect(result.totalVolume).toBe(0)
    expect(result.protocolVolumes).toEqual({ v2: 0, v3: 0, v4: 0 })
  })
})

describe('useDailyTVLWithChange', () => {
  it('reads totals, per-protocol TVL and server-computed changes', () => {
    render(<TestComponent24HrTVL />)
    const result = JSON.parse(screen.getByTestId('result-tvl').textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalTVL).toBe(1800)
    expect(result.totalChangePercent).toBe(12.5)
    expect(result.protocolTVL).toEqual({ v2: 500, v3: 600, v4: 700 })
    expect(result.protocolChangePercent).toEqual({ v2: 1.5, v3: -4, v4: 20 })
  })

  it('reports zeros while loading', () => {
    mockUseGetProtocolStatsQuery.mockReturnValue({ ...defaultMockQueryResult, data: undefined, isLoading: true })

    render(<TestComponent24HrTVL />)
    const result = JSON.parse(screen.getByTestId('result-tvl').textContent || '{}')

    expect(result.isLoading).toBe(true)
    expect(result.totalTVL).toBe(0)
    expect(result.protocolTVL).toEqual({ v2: 0, v3: 0, v4: 0 })
    expect(result.protocolChangePercent).toEqual({})
  })
})
