import { useQuery } from '@tanstack/react-query'
import type { UTCTimestamp } from 'lightweight-charts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useMarginStats24h } from '~/pages/Swap/Margin/chart/useMarginChartData'
import { renderHook } from '~/test-utils/render'

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return { ...actual, useQuery: vi.fn() }
})

const { mockSpotPrice } = vi.hoisted(() => ({
  mockSpotPrice: { current: undefined as number | undefined },
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', () => ({
  useTokenSpotPrice: () => mockSpotPrice.current,
}))
vi.mock('~/hooks/useRestHistoryTarget', () => ({ useRestHistoryTarget: () => ({ chain: 'ETHEREUM' }) }))
vi.mock('~/lib/hooks/usePageVisibility', () => ({ usePageVisibility: () => true }))

const useQueryMock = vi.mocked(useQuery)
const MARKET = getDefaultMarginMarket()

function candle({
  time,
  open,
  high,
  low,
  close,
}: {
  time: number
  open: number
  high: number
  low: number
  close: number
}): PriceChartData {
  return { time: time as UTCTimestamp, value: close, open, high, low, close }
}

function mockDayQuery(result: { data?: PriceChartData[]; error?: Error }): void {
  useQueryMock.mockReturnValue({
    data: result.data,
    error: result.error ?? null,
    isError: result.error !== undefined,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useQuery>)
}

describe('useMarginStats24h', () => {
  beforeEach(() => {
    mockSpotPrice.current = undefined
  })

  it('derives the 24h stats from the DAY series and marks at the spot price', () => {
    mockDayQuery({
      data: [
        candle({ time: 200, open: 110, high: 130, low: 105, close: 120 }),
        candle({ time: 100, open: 95, high: 112, low: 90, close: 100 }),
      ],
    })
    mockSpotPrice.current = 119

    const { result } = renderHook(() => useMarginStats24h({ market: MARKET }))

    expect(result.current.stats24h).toEqual({ changePct: 20, high: 130, low: 90 })
    expect(result.current.markPrice).toBe(119)
  })

  it('falls back to the last close when no spot price is available', () => {
    mockDayQuery({ data: [candle({ time: 100, open: 95, high: 112, low: 90, close: 100 })] })
    mockSpotPrice.current = 101
    const withSpot = renderHook(() => useMarginStats24h({ market: MARKET }))
    expect(withSpot.result.current.markPrice).toBe(101)

    mockSpotPrice.current = undefined
    const withoutSpot = renderHook(() => useMarginStats24h({ market: MARKET }))
    expect(withoutSpot.result.current.markPrice).toBe(100)
  })

  it('shows no stats and no mark when the DAY query fails and no price is available', () => {
    mockDayQuery({ error: new Error('upstream 503') })

    const { result } = renderHook(() => useMarginStats24h({ market: MARKET }))

    expect(result.current.stats24h).toEqual({ changePct: undefined, high: undefined, low: undefined })
    expect(result.current.markPrice).toBeUndefined()
  })
})
