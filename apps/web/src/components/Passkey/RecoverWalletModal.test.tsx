import { useAuthorizationSignature, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { fireEvent, waitFor } from '@testing-library/react'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { attemptPinDecryption, executeRecovery } from 'uniswap/src/features/passkey/recoveryExecute'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { RecoverWalletModal } from '~/components/Passkey/RecoverWalletModal'
import { useModalState } from '~/hooks/useModalState'
import store from '~/state'
import { setCloseModal, setOpenModal } from '~/state/application/reducer'
import { render, screen } from '~/test-utils/render'

vi.mock('@privy-io/react-auth', () => ({
  useAuthorizationSignature: vi.fn(),
  useLoginWithEmail: vi.fn(),
  useLoginWithOAuth: vi.fn(),
  usePrivy: vi.fn(),
}))

vi.mock('@wagmi/core', () => ({
  connect: vi.fn(),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchGetRecoveryConfig: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/passkey/recoveryExecute', () => ({
  attemptPinDecryption: vi.fn(),
  executeRecovery: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/privyBlobStore', () => ({
  fetchEncryptedBlob: vi.fn().mockResolvedValue('blob-fixture'),
  storeEncryptedBlob: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  registerNewPasskey: vi.fn(),
  toRecoveryAuthMethodType: (provider: 'google' | 'apple' | null) =>
    provider === 'google' ? 'GOOGLE' : provider === 'apple' ? 'APPLE' : 'EMAIL',
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient', () => ({
  unitagsApiClient: {
    fetchAddress: vi.fn().mockResolvedValue({ username: null }),
  },
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockSetWalletAddress = vi.fn()
const mockSetWalletId = vi.fn()
const mockSetIsConnected = vi.fn()
const mockConnector = { name: 'Embedded Wallet', type: 'embedded' }

vi.mock('~/state/embeddedWallet/store', () => ({
  useEmbeddedWalletState: () => ({
    setWalletAddress: mockSetWalletAddress,
    setWalletId: mockSetWalletId,
    setIsConnected: mockSetIsConnected,
  }),
  getEmbeddedWalletState: () => ({
    walletAddress: null,
    walletId: null,
    chainId: null,
    isConnected: false,
  }),
}))

vi.mock('~/components/WalletModal/useWagmiConnectorWithId', () => ({
  useWagmiConnectorWithId: () => mockConnector,
}))

vi.mock('~/connection/walletConnect', () => ({
  walletTypeToAmplitudeWalletType: vi.fn(() => 'embedded'),
}))

vi.mock('~/config', () => ({
  getConfig: vi.fn(() => ({ privyAppId: 'test-privy-app-id' })),
  getPrivyConfig: vi.fn(() => ({ appId: 'test-privy-app-id', clientId: 'test-privy-client-id' })),
}))

const mockOnClose = vi.fn()
const mockSendCode = vi.fn()
const mockLoginWithCode = vi.fn()
const mockGetAccessToken = vi.fn()
const mockGenerateAuthorizationSignature = vi.fn().mockResolvedValue('mock-auth-sig')

function setupMocks() {
  vi.mocked(useModalState).mockReturnValue({ isOpen: true, onClose: mockOnClose } as unknown as ReturnType<
    typeof useModalState
  >)
  vi.mocked(useLoginWithEmail).mockReturnValue({
    sendCode: mockSendCode,
    loginWithCode: mockLoginWithCode,
  } as unknown as ReturnType<typeof useLoginWithEmail>)
  vi.mocked(useLoginWithOAuth).mockReturnValue({
    initOAuth: vi.fn(),
  } as unknown as ReturnType<typeof useLoginWithOAuth>)
  vi.mocked(usePrivy).mockReturnValue({
    getAccessToken: mockGetAccessToken,
    ready: true,
    authenticated: false,
  } as unknown as ReturnType<typeof usePrivy>)
  vi.mocked(useAuthorizationSignature).mockReturnValue({
    generateAuthorizationSignature: mockGenerateAuthorizationSignature,
  } as unknown as ReturnType<typeof useAuthorizationSignature>)
}

function typeEmail(value: string) {
  const input = screen.getByPlaceholderText('Recovery email')
  fireEvent.change(input, { target: { value } })
}

function pasteIntoFirstInput(code: string) {
  const firstInput = document.querySelectorAll('input[inputmode="numeric"]')[0]!
  fireEvent.paste(firstInput, {
    clipboardData: { getData: () => code },
  })
}

async function selectEmailLogin() {
  fireEvent.click(screen.getByText('Email'))
  await waitFor(() => {
    expect(screen.getByPlaceholderText('Recovery email')).toBeInTheDocument()
  })
}

async function goToEmailCodeStep() {
  mockSendCode.mockResolvedValue(undefined)
  await selectEmailLogin()
  typeEmail('test@example.com')
  fireEvent.click(screen.getByText('Continue'))
  await waitFor(() => {
    expect(screen.getByText('Resend code')).toBeInTheDocument()
  })
}

async function goToEnterPinStep() {
  mockLoginWithCode.mockResolvedValue(undefined)
  mockGetAccessToken.mockResolvedValue('access-token')
  vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
    found: true,
    encryptedKeyId: 'key-123',
    walletAddress: '0x1234',
  } as never)

  await goToEmailCodeStep()
  pasteIntoFirstInput('123456')

  await waitFor(() => {
    // PIN step visible: 4 digit cells
    const cells = document.querySelectorAll('.digit-input-cell')
    expect(cells).toHaveLength(4)
  })
}

describe('RecoverWalletModal', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    sessionStorage.clear()
    store.dispatch(setCloseModal(ModalName.RecoverWallet))
    const { fetchEncryptedBlob } = await import('uniswap/src/features/passkey/privyBlobStore')
    vi.mocked(fetchEncryptedBlob).mockResolvedValue('blob-fixture')
  })

  it('renders email entry step after selecting email login when no OAuth pending', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await selectEmailLogin()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('opens directly on email entry when initialMethod=email is supplied (skips Login step)', async () => {
    setupMocks()
    store.dispatch(setOpenModal({ name: ModalName.RecoverWallet, initialState: { initialMethod: 'email' } }))
    render(<RecoverWalletModal />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Recovery email')).toBeInTheDocument()
    })
    expect(screen.queryByText('Continue with passkey')).not.toBeInTheDocument()
  })

  it('renders OAUTH_LOADING when OAuth pending in sessionStorage', () => {
    sessionStorage.setItem('recoverWallet:oauthProvider', 'google')
    setupMocks()
    // Privy not yet resolved — useOAuthResult stays in pending state
    vi.mocked(usePrivy).mockReturnValue({
      getAccessToken: mockGetAccessToken,
      ready: false,
      authenticated: false,
    } as unknown as ReturnType<typeof usePrivy>)
    render(<RecoverWalletModal />)
    // Should show spinner, not email entry
    expect(screen.queryByPlaceholderText('Recovery email')).not.toBeInTheDocument()
  })

  it('navigates to OTP step after valid email + continue', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEmailCodeStep()
    expect(screen.getByText('Resend code')).toBeInTheDocument()
  })

  it('navigates to PIN step after OTP verification', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()
    const cells = document.querySelectorAll('.digit-input-cell')
    expect(cells).toHaveLength(4)
  })

  it('hides the back arrow on email entry step', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await selectEmailLogin()

    expect(screen.queryByTestId('step-header-back')).not.toBeInTheDocument()
  })

  it('happy path: correct PIN advances to ADD_PASSKEY step', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: true,
      authPrivateKey: new Uint8Array(32),
    })

    pasteIntoFirstInput('1234')

    await waitFor(() => {
      expect(screen.getByText('Add passkey')).toBeInTheDocument()
    })
  })

  it('wrong PIN: shows the i18n error and resets input', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    // Server's `errorMessage` is intentionally generic SDK copy. The UI must show
    // the product-owned i18n string instead so the message is consistent.
    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: false,
      error: 'wrong_pin',
      errorMessage: 'Incorrect PIN',
    })

    pasteIntoFirstInput('9999')

    await waitFor(() => {
      expect(screen.getByText('Incorrect passcode. Please try again.')).toBeInTheDocument()
    })
    expect(screen.queryByText('Incorrect PIN')).not.toBeInTheDocument()
    // Inputs should be reset (empty)
    const inputs = document.querySelectorAll('input[inputmode="numeric"]') as NodeListOf<HTMLInputElement>
    expect(inputs[0]!.value).toBe('')
  })

  it('wrong PIN + cooldown: shows cooldown timer and hides error text', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: false,
      error: 'wrong_pin',
      errorMessage: 'Incorrect PIN',
      cooldownSeconds: 60,
    })

    pasteIntoFirstInput('9999')

    await waitFor(() => {
      expect(screen.getByText(/Try again in/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('Incorrect passcode. Please try again.')).not.toBeInTheDocument()
    expect(screen.queryByText('Incorrect PIN')).not.toBeInTheDocument()
  })

  it('rate_limited without cooldown: shows error message', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: false,
      error: 'rate_limited',
      errorMessage: 'Too many attempts',
    })

    pasteIntoFirstInput('1234')

    await waitFor(() => {
      expect(screen.getByText('Too many attempts')).toBeInTheDocument()
    })
  })

  it('rate_limited with cooldown: shows cooldown timer and hides error text', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: false,
      error: 'rate_limited',
      errorMessage: 'Too many attempts',
      cooldownSeconds: 30,
    })

    pasteIntoFirstInput('1234')

    await waitFor(() => {
      expect(screen.getByText(/Try again in/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('Too many attempts')).not.toBeInTheDocument()
  })

  it('Add passkey button triggers executeRecovery', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { registerNewPasskey } = await import('uniswap/src/features/passkey/embeddedWallet')
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: true,
      authPrivateKey: new Uint8Array(32),
    })
    pasteIntoFirstInput('1234')

    await waitFor(() => {
      expect(screen.getByText('Add passkey')).toBeInTheDocument()
    })

    mockGetAccessToken.mockResolvedValue('access-token')
    vi.mocked(registerNewPasskey).mockResolvedValue({
      credential: JSON.stringify({ response: { publicKey: 'cHVibGlja2V5' } }),
    } as unknown as Awaited<ReturnType<typeof registerNewPasskey>>)
    vi.mocked(executeRecovery).mockResolvedValue({
      walletAddress: '0xabc',
      credentialId: 'cred-1',
      walletId: 'wallet-1',
    })

    fireEvent.click(screen.getByText('Add passkey'))

    await waitFor(() => {
      expect(executeRecovery).toHaveBeenCalled()
      expect(mockSetWalletAddress).toHaveBeenCalledWith('0xabc')
      expect(mockSetWalletId).toHaveBeenCalledWith('wallet-1')
      expect(mockSetIsConnected).toHaveBeenCalledWith(true)
    })
  })

  it('close resets all state', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEmailCodeStep()

    fireEvent.click(screen.getByTestId('step-header-close'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('sign out button on ADD_PASSKEY step closes modal', async () => {
    setupMocks()
    render(<RecoverWalletModal />)
    await goToEnterPinStep()

    vi.mocked(attemptPinDecryption).mockResolvedValue({
      success: true,
      authPrivateKey: new Uint8Array(32),
    })
    pasteIntoFirstInput('1234')

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Sign out'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  describe('OAuth flow', () => {
    it('navigates to ENTER_PIN on OAuth completion with Google', async () => {
      sessionStorage.setItem('recoverWallet:oauthProvider', 'google')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        getAccessToken: mockGetAccessToken,
        ready: true,
        authenticated: true,
        user: { google: { email: 'user@gmail.com' } },
      } as unknown as ReturnType<typeof usePrivy>)
      mockGetAccessToken.mockResolvedValue('access-token')
      vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
        found: true,
        encryptedKeyId: 'key-123',
        walletAddress: '0x1234',
      } as never)

      render(<RecoverWalletModal />)

      await waitFor(() => {
        const cells = document.querySelectorAll('.digit-input-cell')
        expect(cells).toHaveLength(4)
      })
    })

    it('shows error when OAuth completes but provider email is missing', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      sessionStorage.setItem('recoverWallet:oauthProvider', 'google')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        getAccessToken: mockGetAccessToken,
        ready: true,
        authenticated: true,
        user: { google: { email: undefined } },
      } as unknown as ReturnType<typeof usePrivy>)

      render(<RecoverWalletModal />)

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    })

    it('advances to ENTER_PIN on successful OAuth with recovery config', async () => {
      sessionStorage.setItem('recoverWallet:oauthProvider', 'apple')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        getAccessToken: mockGetAccessToken,
        ready: true,
        authenticated: true,
        user: { apple: { email: 'user@icloud.com' } },
      } as unknown as ReturnType<typeof usePrivy>)
      mockGetAccessToken.mockResolvedValue('access-token')
      vi.mocked(EmbeddedWalletApiClient.fetchGetRecoveryConfig).mockResolvedValue({
        found: true,
        encryptedKeyId: 'key-456',
        walletAddress: '0x5678',
      } as never)

      render(<RecoverWalletModal />)

      await waitFor(() => {
        const cells = document.querySelectorAll('.digit-input-cell')
        expect(cells).toHaveLength(4)
      })
    })

    it('handleClose resets OAuth sessionStorage', () => {
      setupMocks()
      render(<RecoverWalletModal />)

      fireEvent.click(screen.getByTestId('step-header-close'))

      expect(sessionStorage.getItem('recoverWallet:oauthProvider')).toBeNull()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
