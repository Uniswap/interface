import { FeatureFlags } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { PortfolioOverview } from '~/pages/Portfolio/Overview/Overview'
import { render, screen } from '~/test-utils/render'

const mockPortfolioPoolsBalancesEnabled = vi.hoisted(() => ({ value: true }))
const mockShowDemoView = vi.hoisted(() => ({ value: false }))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()

  return {
    ...actual,
    useFeatureFlag: (flag: FeatureFlags) =>
      flag === FeatureFlags.PortfolioPoolsBalances ? mockPortfolioPoolsBalancesEnabled.value : false,
  }
})

vi.mock('uniswap/src/data/rest/getPortfolioChart', () => ({
  getPortfolioHistoricalValueChartQuery: () => ({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
  useGetPortfolioHistoricalValueChartQuery: () => ({
    data: {
      points: [
        { timestamp: 1700000000n, value: 100 },
        { timestamp: 1700003600n, value: 110 },
      ],
    },
    error: null,
    isPending: false,
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
}))

vi.mock('uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch', () => ({
  usePortfolioChartBalanceMismatch: () => ({ isTotalValueMatch: true }),
}))

vi.mock('~/components/emptyWallet/EmptyWalletCards', () => ({
  EmptyWalletCards: () => <div data-testid="empty-wallet-cards" />,
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
  PortfolioChart: ({ showBalanceHeaderRow }: { showBalanceHeaderRow?: boolean }) => (
    <div data-testid={TestID.PortfolioTotalBalance} data-show-balance-header-row={String(showBalanceHeaderRow)}>
      Portfolio Chart
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/Overview/PortfolioPerformance', () => ({
  PortfolioPerformance: () => <div data-testid="portfolio-performance" />,
}))

vi.mock('~/pages/Portfolio/Overview/StatsTiles', () => ({
  OverviewStatsTiles: () => <div data-testid="overview-stats-tiles" />,
}))

describe('PortfolioOverview', () => {
  beforeEach(() => {
    mockPortfolioPoolsBalancesEnabled.value = true
    mockShowDemoView.value = false
  })

  it('passes the balance header row flag to the portfolio chart and renders action tiles as the second column', () => {
    render(<PortfolioOverview />)

    const chart = screen.getByTestId(TestID.PortfolioTotalBalance)
    const actionTiles = screen.getByTestId(TestID.PortfolioActionTiles)

    expect(chart).toHaveAttribute('data-show-balance-header-row', 'true')
    expect(chart.compareDocumentPosition(actionTiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders the balance header row in demo view when the feature flag is enabled', () => {
    mockShowDemoView.value = true

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-show-balance-header-row', 'true')
  })

  it('keeps the legacy chart header layout when the feature flag is disabled', () => {
    mockPortfolioPoolsBalancesEnabled.value = false
    mockShowDemoView.value = true

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-show-balance-header-row', 'false')
  })
})
