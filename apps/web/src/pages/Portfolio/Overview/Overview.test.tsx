import { FeatureFlags } from '@universe/gating'
import type { PortfolioBalanceBreakdown } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
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

  const readPoolsFlag = (flag: FeatureFlags): boolean =>
    flag === FeatureFlags.PortfolioPoolsBalances ? mockPortfolioPoolsBalancesEnabled.value : false
  return {
    ...actual,
    useFeatureFlag: readPoolsFlag,
    // useWalletBalancesIncludeCategories reads the pools flag via the exposure-disabled variant.
    useFeatureFlagWithExposureLoggingDisabled: readPoolsFlag,
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
  usePortfolioBalanceBreakdown: () => ({ data: mockPortfolioBreakdown.value }),
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
  PortfolioChart: ({
    showBalanceHeaderRow,
    tokensValue,
    poolsValue,
  }: {
    showBalanceHeaderRow?: boolean
    tokensValue?: { balanceUSD: number }
    poolsValue?: { balanceUSD: number }
  }) => (
    <div
      data-testid={TestID.PortfolioTotalBalance}
      data-show-balance-header-row={String(showBalanceHeaderRow)}
      data-token-balance-usd={tokensValue?.balanceUSD}
      data-pool-balance-usd={poolsValue?.balanceUSD}
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

  it('passes token and pool breakdown values to the portfolio chart', () => {
    mockPortfolioBreakdown.value = {
      total: { balanceUSD: 15741.99, percentChange: 3.72, absoluteChangeUSD: 564.23 },
      tokens: { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 },
      pools: { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 },
      failedChainIds: [],
    }

    render(<PortfolioOverview />)

    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-token-balance-usd', '8368.94')
    expect(screen.getByTestId(TestID.PortfolioTotalBalance)).toHaveAttribute('data-pool-balance-usd', '7373.05')
  })
})
