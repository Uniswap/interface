import { renderHook } from '@testing-library/react'
import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { usePortfolioChartData } from 'src/components/home/PortfolioChart/usePortfolioChartData'

const { mockPortfolioChartQuery } = vi.hoisted(() => ({ mockPortfolioChartQuery: vi.fn() }))

vi.mock('@universe/mycelium/theme-hooks-compat', () => ({
  useSporeColors: () => ({ statusSuccess: { val: 'green' }, statusCritical: { val: 'red' } }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/balances/getPortfolioChart', () => ({
  useGetPortfolioHistoricalValueChartQuery: mockPortfolioChartQuery,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances', () => ({
  useWalletBalancesIncludeCategories: () => [],
}))

vi.mock('uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier', () => ({
  useRestPortfolioValueModifier: () => undefined,
}))

describe('usePortfolioChartData', () => {
  it.each([
    ['points', 'data'],
    ['tokens', 'tokensData'],
    ['pools', 'poolsData'],
    ['earn', 'earnData'],
  ] as const)('orders %s history without dropping duplicates or mutating cached points', (field, resultField) => {
    const points = Object.freeze([
      Object.freeze({ timestamp: 300n, value: 30 }),
      Object.freeze({ timestamp: 200n, value: 20 }),
      Object.freeze({ timestamp: 100n, value: 10 }),
      Object.freeze({ timestamp: 200n, value: 21 }),
    ])
    mockPortfolioChartQuery.mockReturnValue({
      data: { [field]: points },
      isPending: false,
      isFetching: false,
      error: null,
    })

    const { result } = renderHook(() => usePortfolioChartData({ evmAddress: '0x123', chartPeriod: ChartPeriod.DAY }))

    expect(result.current[resultField]).toEqual([
      { timestamp: 100, value: 10 },
      { timestamp: 200, value: 20 },
      { timestamp: 200, value: 21 },
      { timestamp: 300, value: 30 },
    ])
    if (field === 'points') {
      expect(result.current.chartColor).toBe('green')
    }
    expect(points.map((point) => point.timestamp)).toEqual([300n, 200n, 100n, 200n])
  })
})
