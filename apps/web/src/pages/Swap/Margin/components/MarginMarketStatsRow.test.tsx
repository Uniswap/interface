import { screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginMarketStatsRow } from '~/pages/Swap/Margin/components/MarginMarketStatsRow'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

const { mockStats, mockLiveMarkX18, mockMarkets } = vi.hoisted(() => ({
  mockStats: {
    current: { stats24h: {}, markPrice: undefined } as {
      stats24h: { high?: number; low?: number }
      markPrice?: number
    },
  },
  mockLiveMarkX18: { current: '0' },
  mockMarkets: { current: [] as unknown[] },
}))

vi.mock('~/pages/Swap/Margin/chart/useMarginChartData', () => ({
  useMarginStats24h: () => mockStats.current,
}))

vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    markets: mockMarkets.current,
    getPairMarket: () => mockMarkets.current[0],
    getLive: () => ({ markPriceX18: mockLiveMarkX18.current }),
  }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { pairKey: undefined }) => unknown) => selector({ pairKey: undefined }),
}))

afterEach(() => {
  mockStats.current = { stats24h: {}, markPrice: undefined }
  mockLiveMarkX18.current = '0'
  mockMarkets.current = [MARKET]
})
mockMarkets.current = [MARKET]

describe('MarginMarketStatsRow', () => {
  it('shows mark, 24h high and 24h low under their labels', () => {
    mockStats.current = { stats24h: { high: 2714.16, low: 2573.66 }, markPrice: 2579.13 }
    render(<MarginMarketStatsRow />)
    const row = screen.getByTestId(TestID.MarginMarketStatsRow)
    expect(row).toHaveTextContent('Mark$2,579.13')
    expect(row).toHaveTextContent('24H high$2,714.16')
    expect(row).toHaveTextContent('24H low$2,573.66')
  })

  it('falls back to the markets feed’s mark when there is no live price', () => {
    mockStats.current = { stats24h: {}, markPrice: undefined }
    mockLiveMarkX18.current = '2500000000000000000000'
    render(<MarginMarketStatsRow />)
    expect(screen.getByTestId(TestID.MarginMarketStatsRow)).toHaveTextContent('Mark$2,500.00')
  })

  it('dashes figures it does not have rather than pricing them at zero', () => {
    render(<MarginMarketStatsRow />)
    const row = screen.getByTestId(TestID.MarginMarketStatsRow)
    expect(row).toHaveTextContent('Mark—')
    expect(row).toHaveTextContent('24H high—')
    expect(row).not.toHaveTextContent('$0')
  })

  it('renders nothing without a market', () => {
    mockMarkets.current = []
    render(<MarginMarketStatsRow />)
    expect(screen.queryByTestId(TestID.MarginMarketStatsRow)).not.toBeInTheDocument()
  })
})
