import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { TokenDetailsEarnBanner } from '~/pages/TokenDetails/components/earn/TokenDetailsEarnBanner'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/features/earn/EarnVaultModal', () => ({
  EarnVaultModal: ({
    initialView,
    isOpen,
    vault,
  }: {
    initialView?: string
    isOpen: boolean
    vault?: { id?: string } | null
  }) => (
    <div
      data-testid="earn-vault-modal"
      data-open={String(isOpen)}
      data-initial-view={initialView ?? ''}
      data-vault-id={vault?.id ?? ''}
    />
  ),
}))

vi.mock('~/features/earn/hooks/useEarnVaultConnectFlow', () => ({
  useEarnVaultConnectFlow: () => ({ onConnectWallet: vi.fn() }),
}))

const EARN_VAULT: EarnVaultInfo = {
  id: '1-0x8c106eedad96553e64287a5a6839c3cc78afa3d0',
  currencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  displayCurrencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  vaultAddress: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 3.5,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 500_000,
  curator: { name: 'Gauntlet' },
}

const OTHER_EARN_VAULT: EarnVaultInfo = {
  ...EARN_VAULT,
  id: '1-0xother-vault',
  currencyId: '1-0xdac17f958d2ee523a2206206994597c13d831ec7',
  displayCurrencyId: '1-0xdac17f958d2ee523a2206206994597c13d831ec7',
  vaultAddress: '0x0000000000000000000000000000000000000001',
}

const BASE_EARN_DATA: TokenDetailsEarnData = {
  balanceUsd: 100,
  earnPosition: undefined,
  earnVault: EARN_VAULT,
  hasLoadedPositions: true,
  isError: false,
  isLoggedIn: true,
  projectedAnnualEarningsUsd: 3.5,
  refetch: vi.fn(),
  showEarnError: false,
  tokenSymbol: 'USDC',
  userHasEarnPosition: false,
}

describe('TokenDetailsEarnBanner', () => {
  it('opens the vault details view for connected users without an earn position', () => {
    render(<TokenDetailsEarnBanner earnData={BASE_EARN_DATA} />)

    fireEvent.click(screen.getByText('Get started'))

    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-initial-view', EarnVaultView.Vault)
  })

  it('keeps the banner and modal mounted if banner eligibility briefly turns false after opening', () => {
    const { rerender } = render(<TokenDetailsEarnBanner earnData={BASE_EARN_DATA} />)

    fireEvent.click(screen.getByText('Get started'))
    rerender(<TokenDetailsEarnBanner earnData={{ ...BASE_EARN_DATA, hasLoadedPositions: false }} />)

    expect(screen.getByText('Get started')).toBeInTheDocument()
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-vault-id', EARN_VAULT.id)
  })

  it('hides the banner after an earn position is confirmed', () => {
    const { rerender } = render(<TokenDetailsEarnBanner earnData={BASE_EARN_DATA} />)

    fireEvent.click(screen.getByText('Get started'))
    rerender(<TokenDetailsEarnBanner earnData={{ ...BASE_EARN_DATA, userHasEarnPosition: true }} />)

    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('earn-vault-modal')).toHaveAttribute('data-vault-id', EARN_VAULT.id)
  })

  it('does not keep a selected vault mounted after navigating to a different token', () => {
    const { rerender } = render(<TokenDetailsEarnBanner earnData={BASE_EARN_DATA} />)

    fireEvent.click(screen.getByText('Get started'))
    rerender(
      <TokenDetailsEarnBanner
        earnData={{
          ...BASE_EARN_DATA,
          earnVault: OTHER_EARN_VAULT,
          hasLoadedPositions: false,
          tokenSymbol: 'USDT',
        }}
      />,
    )

    expect(screen.queryByTestId('earn-vault-modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
  })
})
