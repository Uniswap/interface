import { ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useFeatureFlagWithLoading } from '@universe/gating'
import { ExploreContext } from 'state/explore'
import { use24hProtocolVolume, useDailyTVLWithChange } from 'state/explore/protocolStats'
import { render, screen } from 'test-utils/render'
import type { Mock } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlagWithLoading: vi.fn(() => ({ value: true, isLoading: false })), // Ensure mock returns value immediately
  }
})

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

const mockContextValue = {
  exploreStats: { data: undefined, isLoading: false, error: false },
  protocolStats: { data: mockProtocolStatsData, isLoading: false, error: false },
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
  ;(useFeatureFlagWithLoading as Mock).mockReturnValue({ value: true, isLoading: false })
})

describe('use24hProtocolVolume', () => {
  it('calculates total volume and percent change correctly', () => {
    render(
      <ExploreContext.Provider value={mockContextValue}>
        <TestComponent24hProtocolVolume />
      </ExploreContext.Provider>,
    )
    const resultDiv = screen.getByTestId('result-24h')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalVolume).toBe(900)
    expect(result.totalChangePercent).toBe(100)
    expect(result.protocolVolumes).toEqual({ v2: 200, v3: 300, v4: 400 })
  })
})

describe('useDailyTVLWithChange', () => {
  it('calculates total TVL and individual protocol TVL with percent changes correctly', () => {
    render(
      <ExploreContext.Provider value={mockContextValue}>
        <TestComponent24HrTVL />
      </ExploreContext.Provider>,
    )
    const resultDiv = screen.getByTestId('result-tvl')
    const result = JSON.parse(resultDiv.textContent || '{}')

    expect(result.isLoading).toBe(false)
    expect(result.totalTVL).toBe(1800)
    expect(result.totalChangePercent).toBe(100)
    expect(result.protocolTVL).toEqual({ v2: 500, v3: 600, v4: 700 })
    expect(result.protocolChangePercent).toEqual({ v2: 100, v3: 100, v4: 100 })
  })
})
