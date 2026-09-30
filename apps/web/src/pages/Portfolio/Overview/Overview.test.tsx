import { FeatureFlags } from '@universe/gating'
import { TestID } from '@universe/test'
import type { PortfolioBalanceBreakdown } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { PortfolioOverview } from '~/pages/Portfolio/Overview/Overview'
import { render, screen } from '~/test-utils/render'

const mockPortfolioPoolsBalancesEnabled = vi.hoisted(() => ({ value: true }))
const mockShowDemoView = vi.hoisted(() => ({ value: false }))
const mockPortfolioBreakdown = vi.hoisted(
  (): {
    value: PortfolioBalanceBreakdown | undefined
  } => ({ value: undefined }),
)

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()

  const readFlag = (flag: FeatureFlags): boolean =>
    flag === FeatureFlags.PortfolioPoolsBalances ? mockPortfolioPoolsBalancesEnabled.value : false
  return {
    ...actual,
    useFeatureFlag: readFlag,
    // useWalletBalancesIncludeCategories reads the pools flag via the exposure-disabled variant.
    useFeatureFlagWithExposureLoggingDisabled: readFlag,
  }
})

const defaultChartData = {
  points: [
    { timestamp: 1700000000n, value: 100 },
    { timestamp: 1700003600n, value: 110 },
  ],
}
const mockChartQuery = vi.hoisted(
  (): {
    value: {
      data: { points?: { timestamp: bigint; value: number }[] } | undefined
      isPending: boolean
      isPlaceholderData?: boolean
    }
  } => ({
    value: { data: undefined, isPending: false },
  }),
)

vi.mock('uniswap/src/data/apiClients/dataApiService/balances/getPortfolioChart', () => ({
  getPortfolioHistoricalValueChartQuery: () => ({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
  useGetPortfolioHistoricalValueChartQuery: () => ({
    data: mockChartQuery.value.data,
    error: null,
    isPending: mockChartQuery.value.isPending,
    isPlaceholderData: mockChartQuery.value.isPlaceholderData ?? false,
  }),
}))

vi.mock('uniswap/src/features/activity/hooks/useActivityData', () => ({
  useActivityData: () => ({}),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1] }),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioTotalValue: () => ({ data: { balanceUSD: 110 } }),
  usePortfolioBalanceBreakdown: () => ({ data: mockPortfolioBreakdown.value, requestedCategories: [] }),
}))

vi.mock('uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch', () => ({
  usePortfolioChartBalanceMismatch: () => ({ isTotalValueMatch: true }),
}))

vi.mock('~/components/emptyWallet/EmptyWalletCards', () => ({
  EmptyWalletCards: () => <div data-testid={TestID.EmptyWalletCards} />,
}))

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: () => ({ chainId: undefined, isExternalWallet: false }),
}))

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: () => ({
    evmAddress: '0x0000000000000000000000000000000000000001',
    isExternalWallet: false,
    svmAddress: undefined,
  }),
}))

vi.mock('~/pages/Portfolio/hooks/useShowDemoView', () => ({
  useShowDemoView: () => mockShowDemoView.value,
}))

vi.mock('~/pages/Portfolio/Overview/ActionTiles', () => ({
  OverviewActionTiles: () => <div data-testid={TestID.PortfolioActionTiles} />,
}))

vi.mock('~/pages/Portfolio/Overview/hooks/useIsPortfolioZero', () => ({
  useIsPortfolioZero: () => false,
}))

vi.mock('~/pages/Portfolio/Overview/OverviewTables', () => ({
  PortfolioOverviewTables: () => <div data-testid="portfolio-overview-tables" />,
}))

vi.mock('~/pages/Portfolio/Overview/PortfolioChart', () => ({
  PortfolioChart: ({
    tokensValue,
    poolsValue,
    earnValue,
    isLoading,
    isChartEmpty,
  }: {
    tokensValue?: { balanceUSD: number }
    poolsValue?: { balanceUSD: number }
    earnValue?: { balanceUSD: number }
    isLoading: boolean
    isChartEmpty: boolean
  }) => (
    <div
      data-testid={TestID.PortfolioTotalBalance}
      data-token-balance-usd={tokensValue?.balanceUSD}
      data-pool-balance-usd={poolsValue?.balanceUSD}
      data-earn-balance-usd={earnValue?.balanceUSD}
      data-loading={String(isLoading)}
      data-chart-empty={String(isChartEmpty)}
    >
      Portfolio Chart
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/Overview/PortfolioPerformance', () => ({
  PortfolioPerformance: () => <div data-testid="portfolio-performance" />,
}))

describe('PortfolioOverview', () => {
  beforeEach(() => {
    mockPortfolioPoolsBalancesEnabled.value = true
    mockShowDemoView.value = false
    mockPortfolioBreakdown.value = undefined
    mockChartQuery.value = { data: defaultChartData, isPending: false }
  })

  it('marks the chart loading while the chart query is pending', () => {
    mockChartQuery.value = { data: undefined, isPending: true }

    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    expect(chart).toHaveAttribute('data-loading', 'true')
  })

  it('treats a resolved chart response with no points as empty rather than loading', () => {
    // The chart endpoint returns an empty response for a chain the wallet has no history on (e.g. a
    // Solana filter on an EVM-only wallet); that must settle into the empty state, not an endless skeleton.
    mockChartQuery.value = { data: {}, isPending: false }

    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    expect(chart).toHaveAttribute('data-loading', 'false')
    expect(chart).toHaveAttribute('data-chart-empty', 'true')
  })

  it('keeps the chart loading while an empty response is only placeholder data for a new query', () => {
    // Switching filters (e.g. Solana → all networks) keeps the previous empty response as placeholder
    // data while the new fetch runs; that transition must show the skeleton, not the empty state.
    mockChartQuery.value = { data: {}, isPending: false, isPlaceholderData: true }

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-loading', 'true')
  })

  it('shows previous chart data as placeholder while a new period loads', () => {
    mockChartQuery.value = { data: defaultChartData, isPending: false, isPlaceholderData: true }

    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    expect(chart).toHaveAttribute('data-loading', 'false')
    expect(chart).toHaveAttribute('data-chart-empty', 'false')
  })

  it('renders the portfolio chart with action tiles as the second column', () => {
    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    const actionTiles = screen.getByTestId(TestID.PortfolioActionTiles)

    expect(chart.compareDocumentPosition(actionTiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders the portfolio chart in demo view', () => {
    mockShowDemoView.value = true

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toBeInTheDocument()
  })

  it('passes earn breakdown values without exposing pool values when the pools flag is disabled', () => {
    mockPortfolioPoolsBalancesEnabled.value = false
    mockPortfolioBreakdown.value = {
      total: { balanceUSD: 11627.95, percentChange: 1, absoluteChangeUSD: 100 },
      tokens: { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 },
      pools: { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 },
      earn: { balanceUSD: 3259.01, percentChange: 2.2, absoluteChangeUSD: 70 },
      failedChainIds: [],
    }

    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    expect(chart).toHaveAttribute('data-earn-balance-usd', '3259.01')
    expect(chart).not.toHaveAttribute('data-pool-balance-usd')
  })

  it('passes token, pool, and earn breakdown values to the portfolio chart', () => {
    mockPortfolioBreakdown.value = {
      total: { balanceUSD: 15741.99, percentChange: 3.72, absoluteChangeUSD: 564.23 },
      tokens: { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 },
      pools: { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 },
      failedChainIds: [],
      earn: { balanceUSD: 3259.01, percentChange: 2.2, absoluteChangeUSD: 70 },
    }

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-token-balance-usd', '8368.94')
    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-pool-balance-usd', '7373.05')
    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-earn-balance-usd', '3259.01')
  })
})
