import { Platform, UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/assets/constants'
import { useConnectionStatus } from '~/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioOverviewTables } from '~/pages/Portfolio/Overview/OverviewTables'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useConnectionStatus: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/hooks/useEnabledChains')>()),
  useEnabledChains: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Overview/MiniTokensTable', () => ({
  MiniTokensTable: () => <div />,
}))

vi.mock('~/pages/Portfolio/Overview/MiniPoolsTable/MiniPoolsTable', () => ({
  MiniPoolsTable: () => <div />,
}))

vi.mock('~/pages/Portfolio/Overview/MiniActivityTable', () => ({
  MiniActivityTable: () => <div />,
}))

vi.mock('~/pages/Portfolio/Overview/OpenLimitsTable', () => ({
  OpenLimitsTable: () => <div />,
}))

vi.mock('~/pages/Portfolio/Overview/PortfolioEarnSection', () => ({
  PortfolioEarnSection: ({ account, isReadOnly }: { account?: string; isReadOnly?: boolean }) => (
    <div
      data-testid={TestID.PortfolioOverviewEarnSection}
      data-account={account ?? ''}
      data-read-only={String(isReadOnly ?? false)}
    />
  ),
}))

const ACTIVITY_DATA = {} as ActivityRenderData
const PORTFOLIO_ADDRESSES = { evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined }

function mockPortfolioRoutes({ isExternalWallet }: { isExternalWallet: boolean }): void {
  mocked(usePortfolioRoutes).mockReturnValue({
    tab: PortfolioTab.Overview,
    chainId: undefined,
    externalAddress: isExternalWallet ? { address: SAMPLE_SEED_ADDRESS_1, platform: Platform.EVM } : undefined,
    isExternalWallet,
  })
}

// The render wrapper mounts the accounts store provider, which reads `chains` from this hook.
function mockEnabledChains(): void {
  mocked(useEnabledChains).mockReturnValue({
    chains: [UniverseChainId.Mainnet],
    gqlChains: [],
    defaultChainId: UniverseChainId.Mainnet,
    isTestnetModeEnabled: false,
  } as unknown as ReturnType<typeof useEnabledChains>)
}

function renderOverviewTables(): void {
  render(
    <PortfolioOverviewTables
      activityData={ACTIVITY_DATA}
      chainId={undefined}
      portfolioAddresses={PORTFOLIO_ADDRESSES}
    />,
  )
}

describe('PortfolioOverviewTables earn section gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnabledChains()
    mocked(useConnectionStatus).mockReturnValue({ isConnected: true } as ReturnType<typeof useConnectionStatus>)
    mockPortfolioRoutes({ isExternalWallet: false })
  })

  it('shows the earn section for the connected wallet portfolio', () => {
    renderOverviewTables()

    const earnSection = screen.getByTestId(TestID.PortfolioOverviewEarnSection)
    expect(earnSection).toHaveAttribute('data-account', SAMPLE_SEED_ADDRESS_1)
    expect(earnSection).toHaveAttribute('data-read-only', 'false')
  })

  it('keeps the earn section read-only when a connected user views an external wallet', () => {
    mockPortfolioRoutes({ isExternalWallet: true })

    renderOverviewTables()

    expect(screen.getByTestId(TestID.PortfolioOverviewEarnSection)).toHaveAttribute('data-read-only', 'true')
  })

  it('shows a read-only earn section for the disconnected demo portfolio', () => {
    mocked(useConnectionStatus).mockReturnValue({ isConnected: false } as ReturnType<typeof useConnectionStatus>)

    renderOverviewTables()

    const earnSection = screen.getByTestId(TestID.PortfolioOverviewEarnSection)
    expect(earnSection).toHaveAttribute('data-account', SAMPLE_SEED_ADDRESS_1)
    expect(earnSection).toHaveAttribute('data-read-only', 'true')
  })
})
