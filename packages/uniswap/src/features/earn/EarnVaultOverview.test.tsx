import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

const { mockLogEarnVaultCardShowMoreClicked, mockSendEvent } = vi.hoisted(() => ({
  mockLogEarnVaultCardShowMoreClicked: vi.fn(),
  mockSendEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/earn/analytics')>()),
  logEarnVaultCardShowMoreClicked: mockLogEarnVaultCardShowMoreClicked,
}))

vi.mock('utilities/src/telemetry/analytics/analytics', () => ({
  analytics: { sendEvent: mockSendEvent },
}))

const vault = {
  id: 'vault-id',
  currencyId: '1-0xunderlying',
  displayCurrencyId: '1-0xunderlying',
  vaultAddress: '0xvault',
  chainId: 1,
  apyPercent: 4,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 100,
  liquidityUsd: 100,
  curator: { name: 'Morpho' },
} as EarnVaultInfo

describe(EarnVaultOverview, () => {
  beforeEach(() => {
    mockLogEarnVaultCardShowMoreClicked.mockClear()
    mockSendEvent.mockClear()
  })

  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    )
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('hides action buttons in an info-only balance error state', () => {
    render(
      <EarnVaultOverview
        analyticsEntryPoint="global_modal"
        analyticsSurface="web"
        balanceError
        currencyInfo={undefined}
        hasPosition={false}
        isConnected
        position={undefined}
        selectedTab="balance"
        showActionButtons={false}
        symbol="USDC"
        vault={vault}
        onClose={vi.fn()}
        onConnectWallet={vi.fn()}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
        setSelectedTab={vi.fn()}
      />,
    )

    expect(screen.getByTestId(TestID.EarnBalanceError)).toBeDefined()
    expect(screen.queryByText('Deposit')).toBeNull()
    expect(screen.queryByText('Withdraw')).toBeNull()
  })

  it('logs the vault detail impression and show-more interaction', () => {
    render(
      <EarnVaultOverview
        analyticsEntryPoint="search"
        analyticsSurface="web"
        currencyInfo={undefined}
        hasPosition={false}
        isConnected
        position={undefined}
        selectedTab="details"
        symbol="USDC"
        vault={vault}
        onClose={vi.fn()}
        onConnectWallet={vi.fn()}
        onDeposit={vi.fn()}
        onWithdraw={vi.fn()}
        setSelectedTab={vi.fn()}
      />,
    )

    expect(mockSendEvent).toHaveBeenCalledWith(
      EarnEventName.EarnVaultDetailViewed,
      expect.objectContaining({ entry_point: 'search', surface: 'web', vault_id: 'vault-id' }),
    )

    fireEvent.press(screen.getByText('common.button.showMore'))

    expect(mockLogEarnVaultCardShowMoreClicked).toHaveBeenCalledWith(
      expect.objectContaining({ entry_point: 'search', surface: 'web', vault_id: 'vault-id' }),
    )
  })
})
