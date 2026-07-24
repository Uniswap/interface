import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE } from 'uniswap/src/utils/linking'
import type { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import { EARN_ENTRY_POINT_QUERY_PARAM } from '~/pages/TokenDetails/components/earn/earnEntryPointQuery'
import { TokenDetailsEarnSection } from '~/pages/TokenDetails/components/earn/TokenDetailsEarnSection'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('~/features/earn/EarnVaultModal', () => ({ EarnVaultModal: () => null }))

type UseEarnVaultModalStateResult = ReturnType<typeof useEarnVaultModalState>
type SelectedVaultState = UseEarnVaultModalStateResult['selectedVaultState']

type ConnectFlowArgs = {
  selectedVault: SelectedVaultState
  setSelectedVault: (state: SelectedVaultState) => void
}

const { mockCloseModal, mockOpenModal, mockSearchParams, mockSelectedVaultState, mockSetSearchParams } = vi.hoisted(
  () => ({
    mockCloseModal: vi.fn(),
    mockOpenModal: vi.fn(),
    mockSearchParams: new URLSearchParams(),
    mockSelectedVaultState: { current: null as SelectedVaultState },
    mockSetSearchParams: vi.fn(),
  }),
)

const mockUseEarnVaultConnectFlow = vi.hoisted(() =>
  vi.fn((_args: ConnectFlowArgs): { onConnectWallet: () => void } => ({ onConnectWallet: vi.fn() })),
)

vi.mock(
  '~/features/earn/hooks/useEarnVaultConnectFlow',
  (): { useEarnVaultConnectFlow: typeof mockUseEarnVaultConnectFlow } => ({
    useEarnVaultConnectFlow: mockUseEarnVaultConnectFlow,
  }),
)

vi.mock(
  '~/features/earn/hooks/useEarnVaultModalState',
  (): { useEarnVaultModalState: () => UseEarnVaultModalStateResult } => ({
    useEarnVaultModalState: (): UseEarnVaultModalStateResult => ({
      closeModal: mockCloseModal,
      openDepositModal: vi.fn(),
      openModal: mockOpenModal,
      openWithdrawModal: vi.fn(),
      selectedVaultState: mockSelectedVaultState.current,
    }),
  }),
)

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
    mockCloseModal.mockClear()
    mockOpenModal.mockClear()
    mockSelectedVaultState.current = null
    mockSetSearchParams.mockClear()
    mockUseEarnVaultConnectFlow.mockClear()
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

  it('preserves search attribution when auto-opening the modal', async () => {
    const earnVault = { id: 'vault-id' } as EarnVaultInfo
    mockSearchParams.set(EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE)
    mockSearchParams.set(EARN_ENTRY_POINT_QUERY_PARAM, 'search')

    render(<TokenDetailsEarnSection earnData={{ ...baseEarnData, earnVault }} />)

    await waitFor(() => {
      expect(mockOpenModal).toHaveBeenCalledWith(earnVault, {
        analyticsEntryPoint: 'search',
      })
    })
  })

  it('preserves search attribution when reopening the modal after wallet connection', () => {
    const earnVault = { id: 'vault-id' } as EarnVaultInfo
    const selectedVaultState: NonNullable<SelectedVaultState> = {
      analyticsEntryPoint: EarnEntryPoint.Search,
      initialView: EarnVaultView.Vault,
      vault: earnVault,
    }
    mockSelectedVaultState.current = selectedVaultState

    render(<TokenDetailsEarnSection earnData={{ ...baseEarnData, earnVault }} />)

    const connectFlowArgs = mockUseEarnVaultConnectFlow.mock.calls.at(-1)?.[0]
    expect(connectFlowArgs?.selectedVault).toBe(selectedVaultState)

    connectFlowArgs?.setSelectedVault(null)
    expect(mockCloseModal).toHaveBeenCalledOnce()

    connectFlowArgs?.setSelectedVault(selectedVaultState)
    expect(mockOpenModal).toHaveBeenCalledWith(earnVault, {
      analyticsEntryPoint: EarnEntryPoint.Search,
      initialView: EarnVaultView.Vault,
    })
  })

  it('falls back to token details attribution for an invalid entry point', async () => {
    const earnVault = { id: 'vault-id' } as EarnVaultInfo
    mockSearchParams.set(EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE)
    mockSearchParams.set(EARN_ENTRY_POINT_QUERY_PARAM, 'invalid')

    render(<TokenDetailsEarnSection earnData={{ ...baseEarnData, earnVault }} />)

    await waitFor(() => {
      expect(mockOpenModal).toHaveBeenCalledWith(earnVault, {
        analyticsEntryPoint: 'tdp_earn_section',
      })
    })
  })
})
