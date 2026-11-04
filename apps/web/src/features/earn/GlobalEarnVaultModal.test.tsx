import { UniverseChainId } from '@universe/chains'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { GlobalEarnVaultModal } from '~/features/earn/GlobalEarnVaultModal'
import { useGlobalEarnVaultModalStore } from '~/features/earn/globalEarnVaultModalStore'
import { act, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

vi.mock('~/features/earn/EarnVaultModal', () => ({
  EarnVaultModal: ({ isOpen, vault }: { isOpen: boolean; vault: EarnVaultInfo }) => (
    <div data-testid="earn-vault-modal" data-open={String(isOpen)} data-vault-id={vault.id} />
  ),
}))

const mockUseEnabledChains = vi.mocked(useEnabledChains)

const VAULT: EarnVaultInfo = {
  id: 'vault-a',
  currencyId: '1-0xa',
  displayCurrencyId: '1-0xa',
  vaultAddress: '0xa',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 4,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 0,
  liquidityUsd: 0,
  curator: { name: 'Gauntlet' },
}

describe(GlobalEarnVaultModal, () => {
  beforeEach(() => {
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
    useGlobalEarnVaultModalStore.setState({ selectedVaultState: null })
  })

  it('renders the selected vault', async () => {
    act(() => {
      useGlobalEarnVaultModalStore.getState().openDepositModal(VAULT)
    })

    render(<GlobalEarnVaultModal />)

    expect(await screen.findByTestId('earn-vault-modal')).toHaveAttribute('data-vault-id', VAULT.id)
  })

  it('clears stale modal state without rendering in testnet mode', async () => {
    mockUseEnabledChains.mockReturnValue({
      chains: [],
      defaultChainId: UniverseChainId.Sepolia,
      isTestnetModeEnabled: true,
    })
    act(() => {
      useGlobalEarnVaultModalStore.setState({
        selectedVaultState: { vault: VAULT, initialView: EarnVaultView.DepositAmount },
      })
    })

    render(<GlobalEarnVaultModal />)

    expect(screen.queryByTestId('earn-vault-modal')).not.toBeInTheDocument()
    await waitFor(() => expect(useGlobalEarnVaultModalStore.getState().selectedVaultState).toBeNull())
  })
})
