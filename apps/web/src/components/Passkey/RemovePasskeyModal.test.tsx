import { fireEvent, waitFor } from '@testing-library/react'
import { deleteAuthenticatorWithPasskey, disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { AuthenticatorProvider } from '~/components/Passkey/authenticatorProvider'
import { RemovePasskeyModal } from '~/components/Passkey/RemovePasskeyModal'
import { useDisconnect } from '~/hooks/useDisconnect'
import { useModalState } from '~/hooks/useModalState'
import type { DeletePasskeyModalParams } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppSelector } from '~/state/hooks'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  Action: { DELETE_AUTHENTICATOR: 0 },
  deleteAuthenticatorWithPasskey: vi.fn(),
  disconnectWallet: vi.fn(),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/embeddedWallet/store')>()),
  useEmbeddedWalletState: vi.fn(),
}))

vi.mock('~/state/hooks', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(() => vi.fn()),
}))

vi.mock('~/hooks/useDisconnect', () => ({
  useDisconnect: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(),
}))

vi.mock('~/components/AccountDrawer/menuState', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/AccountDrawer/menuState')>()),
  useSetMenu: vi.fn(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => '0xabc'),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioTotalValue: vi.fn(() => ({ data: { balanceUSD: 100 } })),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: vi.fn(() => ({
    convertFiatAmountFormatted: vi.fn((value: unknown) => String(value)),
  })),
}))

vi.mock('~/components/StatusIcon', () => ({
  StatusIcon: () => null,
}))

vi.mock('~/components/AccountDetails/AddressDisplay', () => ({
  AddressDisplay: ({ address }: { address: string }) => <div>{address}</div>,
}))

const mockOnClose = vi.fn()
const mockDisconnect = vi.fn()
const mockDrawerClose = vi.fn()
const mockDrawerOpen = vi.fn()
const mockSetMenu = vi.fn()

const MOCK_INITIAL_STATE: DeletePasskeyModalParams['initialState'] = {
  authenticatorId: 'cred-123',
  authenticatorLabel: 'iCloud',
  authenticatorProvider: AuthenticatorProvider.Apple,
  isLastAuthenticator: false,
}

function setupMocks(initialState = MOCK_INITIAL_STATE) {
  vi.mocked(useModalState).mockReturnValue({ isOpen: true, onClose: mockOnClose } as unknown as ReturnType<
    typeof useModalState
  >)
  vi.mocked(useEmbeddedWalletState).mockReturnValue({ walletId: 'wallet-id' } as ReturnType<
    typeof useEmbeddedWalletState
  >)
  vi.mocked(useAppSelector).mockReturnValue(initialState)
  vi.mocked(useDisconnect).mockReturnValue(mockDisconnect)
  vi.mocked(useAccountDrawer).mockReturnValue({
    isOpen: true,
    open: mockDrawerOpen,
    close: mockDrawerClose,
  } as unknown as ReturnType<typeof useAccountDrawer>)
  vi.mocked(useSetMenu).mockReturnValue(mockSetMenu)
}

describe('RemovePasskeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the speedbump step by default', () => {
    setupMocks()
    render(<RemovePasskeyModal />)
    expect(screen.getByText('Make sure you have a backup')).toBeInTheDocument()
    expect(screen.getByText('Recovery phrase')).toBeInTheDocument()
    expect(screen.queryByText('Delete passkey')).not.toBeInTheDocument()
  })

  it('renders "Never viewed" when the recovery phrase has never been exported', () => {
    setupMocks({ ...MOCK_INITIAL_STATE, lastExportedMs: undefined })
    render(<RemovePasskeyModal />)
    expect(screen.getByText('Never viewed')).toBeInTheDocument()
  })

  it('renders the formatted "Last viewed" date when the recovery phrase was exported', () => {
    // Sep 26 in the current year — Figma copy is "Last viewed Sep 26"
    const date = new Date(new Date().getFullYear(), 8, 26).getTime()
    setupMocks({ ...MOCK_INITIAL_STATE, lastExportedMs: date })
    render(<RemovePasskeyModal />)
    expect(screen.getByText('Last viewed Sep 26')).toBeInTheDocument()
  })

  it('navigates to the recovery phrase prompt when the row is tapped', () => {
    setupMocks()
    render(<RemovePasskeyModal />)
    fireEvent.click(screen.getByText('Recovery phrase'))
    expect(mockSetMenu).toHaveBeenCalledWith({ variant: MenuStateVariant.RECOVERY_PHRASE_DOWNLOAD_PROMPT })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('advances to the confirm step when Continue is pressed', () => {
    setupMocks()
    render(<RemovePasskeyModal />)
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Delete passkey')).toBeInTheDocument()
    expect(screen.getByText('iCloud')).toBeInTheDocument()
  })

  it('calls deleteAuthenticatorWithPasskey when Delete is pressed after acknowledgement', async () => {
    setupMocks()
    vi.mocked(deleteAuthenticatorWithPasskey).mockResolvedValue(true)
    render(<RemovePasskeyModal />)
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByTestId('delete-passkey-acknowledge'))
    fireEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(deleteAuthenticatorWithPasskey).toHaveBeenCalledTimes(1))
    expect(deleteAuthenticatorWithPasskey).toHaveBeenCalledWith({
      authenticator: { credentialId: 'cred-123' },
      walletId: 'wallet-id',
    })
  })

  it('disconnects when deleting the last authenticator', async () => {
    setupMocks({ ...MOCK_INITIAL_STATE, isLastAuthenticator: true })
    vi.mocked(deleteAuthenticatorWithPasskey).mockResolvedValue(true)
    render(<RemovePasskeyModal />)
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByTestId('delete-passkey-acknowledge'))
    fireEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(disconnectWallet).toHaveBeenCalledTimes(1))
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
    expect(mockDrawerClose).toHaveBeenCalledTimes(1)
  })

  it('returns to the speedbump step when the back button is pressed', () => {
    setupMocks()
    render(<RemovePasskeyModal />)
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Delete passkey')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('delete-passkey-back'))
    expect(screen.getByText('Make sure you have a backup')).toBeInTheDocument()
  })

  it('renders snapshot of the speedbump step', () => {
    setupMocks()
    render(<RemovePasskeyModal />)
    expect(document.body).toMatchSnapshot()
  })
})
