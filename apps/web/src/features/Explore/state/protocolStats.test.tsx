import { ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useFeatureFlagWithLoading } from '@universe/gating'
import type { Mock } from 'vitest'
import { vi } from 'vitest'
import { ExploreContextProvider } from '~/features/Explore/state'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlagWithLoading: vi.fn(() => ({ value: true, isLoading: false })), // Ensure mock returns value immediately
  }
})

const mockUseProtocolStatsQuery = vi.fn()
vi.mock('uniswap/src/data/rest/protocolStats', () => ({
  useProtocolStatsQuery: (input: unknown) => mockUseProtocolStatsQuery(input),
}))

const createTimestampedAmount = (timestamp: number, value: number) => ({ timestamp, value })

const mockHistoricalProtocolVolume = {
  Month: {
    v2: [createTimestampedAmount(1, 100)],
    v3: [createTimestampedAmount(1, 150)],
    v4: [createTimestampedAmount(1, 200)],
  },
}

mockHistoricalProtocolVolume.Month.v2.push(createTimestampedAmount(2, 200))
mockHistoricalProtocolVolume.Month.v3.push(createTimestampedAmount(2, 300))
mockHistoricalProtocolVolume.Month.v4.push(createTimestampedAmount(2, 400))

const mockDailyProtocolTvl = {
  v2: [createTimestampedAmount(1, 250)],
  v3: [createTimestampedAmount(1, 300)],
  v4: [createTimestampedAmount(1, 350)],
}
mockDailyProtocolTvl.v2.push(createTimestampedAmount(2, 500))
mockDailyProtocolTvl.v3.push(createTimestampedAmount(2, 600))
mockDailyProtocolTvl.v4.push(createTimestampedAmount(2, 700))

const mockProtocolStatsData = {
  historicalProtocolVolume: mockHistoricalProtocolVolume,
  dailyProtocolTvl: mockDailyProtocolTvl,
} as unknown as ProtocolStatsResponse

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

function renderWithProvider(ui: React.ReactElement) {
  return render(<ExploreContextProvider>{ui}</ExploreContextProvider>)
}

beforeEach(() => {
  ;(useFeatureFlagWithLoading as Mock).mockReturnValue({ value: true, isLoading: false })
  mockUseProtocolStatsQuery.mockReturnValue(defaultMockQueryResult)
})

describe('use24hProtocolVolume', () => {
  it('calculates total volume and percent change correctly', () => {
    renderWithProvider(<TestComponent24hProtocolVolume />)
    const resultDiv = screen.getByTestId('result-24h')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalVolume).toBe(900)
    expect(result.totalChangePercent).toBe(100)
    expect(result.protocolVolumes).toEqual({ v2: 200, v3: 300, v4: 400 })
  })

  it('uses latest available data per protocol when timestamps differ', () => {
    const mismatchedVolumeData = {
      Month: {
        v2: [createTimestampedAmount(1, 100), createTimestampedAmount(2, 200), createTimestampedAmount(3, 400)],
        v3: [createTimestampedAmount(1, 150), createTimestampedAmount(2, 300)],
        v4: [createTimestampedAmount(1, 200)],
      },
    }

    mockUseProtocolStatsQuery.mockReturnValue({
      ...defaultMockQueryResult,
      data: {
        historicalProtocolVolume: mismatchedVolumeData,
      } as unknown as ProtocolStatsResponse,
    })

    renderWithProvider(<TestComponent24hProtocolVolume />)
    const resultDiv = screen.getByTestId('result-24h')
    const result = JSON.parse(resultDiv.textContent || '{}')

    // Each protocol should use its latest available value, NOT 0
    expect(result.protocolVolumes.v2).toBe(400)
    expect(result.protocolVolumes.v3).toBe(300)
    expect(result.protocolVolumes.v4).toBe(200)

    // Total should be sum of latest available values
    expect(result.totalVolume).toBe(900)

    // Aggregated total change percentage should be calculated correctly
    // Total latest: 400 (v2 at t=3) + 300 (v3 at t=2) + 200 (v4 at t=1) = 900
    // Total previous: 200 (v2 at t=2) + 150 (v3 at t=1) + 0 (v4 has no previous) = 350
    // Expected: (900 - 350) / 350 * 100 = 157.14%
    expect(result.totalChangePercent).toBeCloseTo(157.14, 1)
  })

  it('handles empty data gracefully for all protocols', () => {
    // Mock console.warn since empty data will trigger logger warnings
    const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const emptyVolumeData = {
      Month: {
        v2: [],
        v3: [],
        v4: [],
      },
    }

    mockUseProtocolStatsQuery.mockReturnValue({
      ...defaultMockQueryResult,
      data: {
        historicalProtocolVolume: emptyVolumeData,
      } as unknown as ProtocolStatsResponse,
    })

    renderWithProvider(<TestComponent24hProtocolVolume />)
    const resultDiv = screen.getByTestId('result-24h')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.totalVolume).toBe(0)
    expect(result.totalChangePercent).toBe(0)
    expect(result.protocolVolumes).toEqual({ v2: 0, v3: 0, v4: 0 })
    // Verify warnings were logged for missing data
    expect(mockWarn).toHaveBeenCalled()
    mockWarn.mockRestore()
  })
})

describe('useDailyTVLWithChange', () => {
  it('calculates total TVL and individual protocol TVL with percent changes correctly', () => {
    renderWithProvider(<TestComponent24HrTVL />)
    const resultDiv = screen.getByTestId('result-tvl')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalTVL).toBe(1800)
    expect(result.totalChangePercent).toBe(100)
    expect(result.protocolTVL).toEqual({ v2: 500, v3: 600, v4: 700 })
    expect(result.protocolChangePercent).toEqual({ v2: 100, v3: 100, v4: 100 })
  })

  it('uses latest available data per protocol when timestamps differ', () => {
    // Simulate mismatched timestamps - a common scenario when protocols update at different times
    const mismatchedTvlData = {
      v2: [createTimestampedAmount(1, 100), createTimestampedAmount(2, 200), createTimestampedAmount(3, 300)],
      v3: [createTimestampedAmount(1, 150), createTimestampedAmount(2, 250)], // Missing timestamp 3
      v4: [createTimestampedAmount(1, 200)], // Only has timestamp 1
    }

    mockUseProtocolStatsQuery.mockReturnValue({
      ...defaultMockQueryResult,
      data: {
        dailyProtocolTvl: mismatchedTvlData,
      } as unknown as ProtocolStatsResponse,
    })

    renderWithProvider(<TestComponent24HrTVL />)
    const resultDiv = screen.getByTestId('result-tvl')
    const result = JSON.parse(resultDiv.textContent || '{}')

    // V2 should use timestamp 3 (value: 300)
    expect(result.protocolTVL.v2).toBe(300)
    // V3 should use timestamp 2 (value: 250), NOT 0
    expect(result.protocolTVL.v3).toBe(250)
    // V4 should use timestamp 1 (value: 200), NOT 0
    expect(result.protocolTVL.v4).toBe(200)
    // Total should be sum of latest available values
    expect(result.totalTVL).toBe(750)

    // Percent changes should use each protocol's own previous value
    expect(result.protocolChangePercent.v2).toBe(50) // (300-200)/200 * 100
    expect(result.protocolChangePercent.v3).toBeCloseTo(66.67, 1) // (250-150)/150 * 100
    expect(result.protocolChangePercent.v4).toBe(0) // No previous data

    // Aggregated total change percentage should be calculated correctly
    // Total latest: 300 (v2 at t=3) + 250 (v3 at t=2) + 200 (v4 at t=1) = 750
    // Total previous: 200 (v2 at t=2) + 150 (v3 at t=1) + 0 (v4 has no previous) = 350
    // Expected: (750 - 350) / 350 * 100 = 114.29%
    expect(result.totalChangePercent).toBeCloseTo(114.29, 1)
  })

  it('handles empty data gracefully for all protocols', () => {
    // Mock console.warn since empty data will trigger logger warnings
    const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const emptyTvlData = {
      v2: [],
      v3: [],
      v4: [],
    }

    mockUseProtocolStatsQuery.mockReturnValue({
      ...defaultMockQueryResult,
      data: {
        dailyProtocolTvl: emptyTvlData,
      } as unknown as ProtocolStatsResponse,
    })

    renderWithProvider(<TestComponent24HrTVL />)
    const resultDiv = screen.getByTestId('result-tvl')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.totalTVL).toBe(0)
    expect(result.totalChangePercent).toBe(0)
    expect(result.protocolTVL).toEqual({ v2: 0, v3: 0, v4: 0 })
    expect(result.protocolChangePercent).toEqual({ v2: 0, v3: 0, v4: 0 })
    // Verify warnings were logged for missing data
    expect(mockWarn).toHaveBeenCalled()
    mockWarn.mockRestore()
  })
})
