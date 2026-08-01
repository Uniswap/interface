import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { GlobalEarnVaultModal } from '~/features/earn/GlobalEarnVaultModal'
import { useGlobalEarnVaultModalStore } from '~/features/earn/globalEarnVaultModalStore'
import { act, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/features/earn/hooks/useIsEarnEnabled', () => ({
  useIsEarnEnabled: vi.fn(),
}))

vi.mock('~/features/earn/EarnVaultModal', () => ({
  EarnVaultModal: ({ isOpen, vault }: { isOpen: boolean; vault: EarnVaultInfo }) => (
    <div data-testid="earn-vault-modal" data-open={String(isOpen)} data-vault-id={vault.id} />
  ),
}))

const mockUseIsEarnEnabled = vi.mocked(useIsEarnEnabled)

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
    mockUseIsEarnEnabled.mockReturnValue(true)
    useGlobalEarnVaultModalStore.setState({ selectedVaultState: null })
  })

  it('renders the selected vault when Earn is enabled', async () => {
    act(() => {
      useGlobalEarnVaultModalStore.getState().openDepositModal(VAULT)
    })

    render(<GlobalEarnVaultModal />)

    expect(await screen.findByTestId('earn-vault-modal')).toHaveAttribute('data-vault-id', VAULT.id)
  })

  it('clears stale modal state without rendering when Earn is disabled', async () => {
    mockUseIsEarnEnabled.mockReturnValue(false)
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
