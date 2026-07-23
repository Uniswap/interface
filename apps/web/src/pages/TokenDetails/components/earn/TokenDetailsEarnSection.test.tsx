import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE } from 'uniswap/src/utils/linking'
import { EARN_ENTRY_POINT_QUERY_PARAM } from '~/pages/TokenDetails/components/earn/earnEntryPointQuery'
import { TokenDetailsEarnSection } from '~/pages/TokenDetails/components/earn/TokenDetailsEarnSection'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('~/features/earn/EarnVaultModal', () => ({ EarnVaultModal: () => null }))

const { mockOpenModal, mockSetSearchParams, mockSearchParams } = vi.hoisted(() => ({
  mockOpenModal: vi.fn(),
  mockSearchParams: new URLSearchParams(),
  mockSetSearchParams: vi.fn(),
}))

vi.mock('~/features/earn/hooks/useEarnVaultModalState', () => ({
  useEarnVaultModalState: () => ({
    closeModal: vi.fn(),
    openDepositModal: vi.fn(),
    openModal: mockOpenModal,
    openWithdrawModal: vi.fn(),
    selectedVaultState: null,
  }),
}))

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}))

const baseEarnData: TokenDetailsEarnData = {
  balanceUsd: undefined,
  earnPosition: undefined,
  earnVault: undefined,
  hasLoadedPositions: false,
  isError: false,
  isLoggedIn: true,
  projectedAnnualEarningsUsd: undefined,
  refetch: vi.fn(),
  showEarnError: false,
  tokenSymbol: 'USDC',
  userHasEarnPosition: false,
}

describe('TokenDetailsEarnSection', () => {
  beforeEach(() => {
    mockOpenModal.mockClear()
    mockSetSearchParams.mockClear()
    Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key))
  })

  it('shows the error state with a working retry when showEarnError is set', () => {
    const refetch = vi.fn()
    render(
      <TokenDetailsEarnSection
        earnData={{ ...baseEarnData, showEarnError: true, earnVault: {} as EarnVaultInfo, refetch }}
      />,
    )

    expect(screen.getByTestId(TestID.EarnBalanceError)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.EarnBalanceErrorRetry))
    expect(refetch).toHaveBeenCalled()
  })

  it('does not show the error state when showEarnError is false', () => {
    render(<TokenDetailsEarnSection earnData={{ ...baseEarnData, isError: true, earnVault: undefined }} />)

    expect(screen.queryByTestId(TestID.EarnBalanceError)).not.toBeInTheDocument()
  })

  it('preserves vault-share deep-link attribution when auto-opening the modal', async () => {
    const earnVault = { id: 'vault-id' } as EarnVaultInfo
    mockSearchParams.set(EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE)
    mockSearchParams.set(EARN_ENTRY_POINT_QUERY_PARAM, 'tdp_vault_share_banner')

    render(<TokenDetailsEarnSection earnData={{ ...baseEarnData, earnVault }} />)

    await waitFor(() => {
      expect(mockOpenModal).toHaveBeenCalledWith(earnVault, {
        analyticsEntryPoint: 'tdp_vault_share_banner',
      })
    })
    expect(mockSetSearchParams).toHaveBeenCalled()
  })
})
