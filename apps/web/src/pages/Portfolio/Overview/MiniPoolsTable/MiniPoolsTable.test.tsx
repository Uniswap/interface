import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { useMiniPoolsTableColumns } from '~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableColumns'
import { useMiniPoolsTableData } from '~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableData'
import { MiniPoolsTable } from '~/pages/Portfolio/Overview/MiniPoolsTable/MiniPoolsTable'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableColumns', () => ({
  useMiniPoolsTableColumns: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Overview/MiniPoolsTable/hooks/useMiniPoolsTableData', () => ({
  useMiniPoolsTableData: vi.fn(),
}))

vi.mock('~/components/Table', () => ({
  Table: () => <div data-testid="mini-pools-table" />,
}))

vi.mock('~/pages/Portfolio/Overview/TableSectionHeader', () => ({
  TableSectionHeader: ({ children }: { children: JSX.Element }) => <div>{children}</div>,
}))

vi.mock('~/pages/Portfolio/Overview/ViewAllButton', () => ({
  ViewAllButton: ({
    href,
    label,
    elementName,
    testId,
  }: {
    href: string
    label: string
    elementName: string
    testId?: string
  }) => (
    <a href={href} data-testid={testId} data-element-name={elementName}>
      {label}
    </a>
  ),
}))

const MOCK_POSITION = {} as PositionInfo

describe('MiniPoolsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Overview,
      chainId: undefined,
      externalAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useMiniPoolsTableColumns).mockReturnValue([])
    mocked(useMiniPoolsTableData).mockReturnValue({
      positions: [MOCK_POSITION],
      showLoading: false,
      hasNoData: false,
    })
  })

  it('should link View all pools to Portfolio Pools tab when portfolio pools balances flag is enabled', () => {
    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} />)

    const viewAllPoolsLink = screen.getByTestId(TestID.PortfolioOverviewViewAllPools)
    expect(viewAllPoolsLink).toHaveAttribute('href', '/portfolio/pools')
    expect(viewAllPoolsLink).toHaveAttribute('data-element-name', ElementName.PortfolioViewAllPools)
  })

  it('should link View all pools to legacy positions page when portfolio pools balances flag is disabled', () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewViewAllPools)).toHaveAttribute('href', '/positions')
  })

  it('should preserve the selected chain when linking to Portfolio Pools tab', () => {
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Overview,
      chainId: UniverseChainId.Base,
      externalAddress: undefined,
      isExternalWallet: false,
    })

    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} chainId={UniverseChainId.Base} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewViewAllPools)).toHaveAttribute(
      'href',
      '/portfolio/pools?chain=base',
    )
  })

  it('should preserve external wallet address when linking to Portfolio Pools tab', () => {
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Overview,
      chainId: undefined,
      externalAddress: { address: SAMPLE_SEED_ADDRESS_1, platform: Platform.EVM },
      isExternalWallet: true,
    })

    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} />)

    expect(screen.getByTestId(TestID.PortfolioOverviewViewAllPools)).toHaveAttribute(
      'href',
      `/portfolio/${SAMPLE_SEED_ADDRESS_1}/pools`,
    )
  })

  it('should build read-only columns when viewing an external wallet', () => {
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Overview,
      chainId: undefined,
      externalAddress: { address: SAMPLE_SEED_ADDRESS_1, platform: Platform.EVM },
      isExternalWallet: true,
    })

    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} />)

    expect(mocked(useMiniPoolsTableColumns)).toHaveBeenCalledWith({ isLoading: false, readOnly: true })
  })

  it('should build editable columns when viewing the connected wallet', () => {
    render(<MiniPoolsTable account={SAMPLE_SEED_ADDRESS_1} />)

    expect(mocked(useMiniPoolsTableColumns)).toHaveBeenCalledWith({ isLoading: false, readOnly: false })
  })
})
