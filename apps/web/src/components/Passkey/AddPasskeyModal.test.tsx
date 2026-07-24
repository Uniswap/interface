import { fireEvent, waitFor } from '@testing-library/react'
import {
  authenticateWithPasskey,
  listAuthenticators,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AddPasskeyModal } from '~/components/Passkey/AddPasskeyModal'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  authenticateWithPasskey: vi.fn(),
  AuthenticatorAttachment: { PLATFORM: 0, CROSS_PLATFORM: 1 },
  registerNewAuthenticator: vi.fn(),
  startAddAuthenticatorSession: vi.fn(),
  listAuthenticators: vi.fn().mockResolvedValue({ authenticators: [] }),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/embeddedWallet/store')>()),
  useEmbeddedWalletState: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery', () => ({
  useUnitagsAddressQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddress: vi.fn(() => '0xabc'),
}))

const mockOnClose = vi.fn()

function setupMocks() {
  vi.mocked(useModalState).mockReturnValue({ isOpen: true, onClose: mockOnClose } as unknown as ReturnType<
    typeof useModalState
  >)
  vi.mocked(useEmbeddedWalletState).mockReturnValue({ walletId: 'wallet-id' } as ReturnType<
    typeof useEmbeddedWalletState
  >)
}

describe('AddPasskeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verify step by default', () => {
    setupMocks()
    render(<AddPasskeyModal />)
    expect(screen.getByText('Passkey required')).toBeInTheDocument()
    expect(screen.getByText('Sign in with passkey')).toBeInTheDocument()
  })

  it('calls startAddAuthenticatorSession when Sign in button is pressed', async () => {
    setupMocks()
    render(<AddPasskeyModal />)
    fireEvent.click(screen.getByText('Sign in with passkey'))
    await waitFor(() => expect(startAddAuthenticatorSession).toHaveBeenCalledTimes(1))
  })

  it('renders snapshot at verify step', () => {
    setupMocks()
    render(<AddPasskeyModal />)
    expect(document.body).toMatchSnapshot()
  })
})
