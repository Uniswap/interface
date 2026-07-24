import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { fireEvent, waitFor } from '@testing-library/react'
import { checkRecoveryAvailability } from 'uniswap/src/features/passkey/checkRecoveryAvailability'
import { authorizeAndCompleteRecovery, encryptAndStoreRecovery } from 'uniswap/src/features/passkey/embeddedWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AddBackupLoginModal } from '~/components/Passkey/AddBackupLoginModal'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { render, screen } from '~/test-utils/render'

vi.mock('@privy-io/react-auth', () => ({
  useLoginWithEmail: vi.fn(),
  useLoginWithOAuth: vi.fn(),
  usePrivy: vi.fn(),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(),
}))

vi.mock('~/state/embeddedWallet/store', () => ({
  useEmbeddedWalletState: vi.fn(),
  getEmbeddedWalletState: vi.fn().mockReturnValue({ chainId: 1 }),
}))

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  encryptAndStoreRecovery: vi.fn(),
  authorizeAndCompleteRecovery: vi.fn(),
  RecoveryMethod: vi.fn().mockImplementation((args: Record<string, unknown>) => args),
  toRecoveryAuthMethodType: (provider: 'google' | 'apple' | null) =>
    provider === 'google' ? 'GOOGLE' : provider === 'apple' ? 'APPLE' : 'EMAIL',
}))

vi.mock('uniswap/src/features/passkey/checkRecoveryAvailability', () => ({
  checkRecoveryAvailability: vi.fn(),
}))

vi.mock('~/config', () => ({
  getConfig: vi.fn(() => ({ privyAppId: 'test-privy-app-id', privyClientId: 'test-privy-client-id' })),
  getPrivyConfig: vi.fn(() => ({ appId: 'test-privy-app-id', clientId: 'test-privy-client-id' })),
}))

const mockOnClose = vi.fn()
const mockSendCode = vi.fn()
const mockLoginWithCode = vi.fn()
const mockGetAccessToken = vi.fn()
const mockInitOAuth = vi.fn()

function setupMocks({ oauthLoading = false }: { oauthLoading?: boolean } = {}) {
  vi.mocked(useModalState).mockReturnValue({ isOpen: true, onClose: mockOnClose } as unknown as ReturnType<
    typeof useModalState
  >)
  vi.mocked(useLoginWithEmail).mockReturnValue({
    sendCode: mockSendCode,
    loginWithCode: mockLoginWithCode,
  } as unknown as ReturnType<typeof useLoginWithEmail>)
  vi.mocked(usePrivy).mockReturnValue({
    getAccessToken: mockGetAccessToken,
    user: { id: 'privy-user-123' },
    ready: true,
    authenticated: false,
    // `ensureLoggedOut` (called before sendCode / resendCode / initOAuth) awaits `logout()`
    // when `user` is truthy; tests need this to resolve or the mutation path short-circuits.
    logout: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof usePrivy>)
  vi.mocked(useLoginWithOAuth).mockReturnValue({
    initOAuth: mockInitOAuth,
    loading: oauthLoading,
    state: { status: 'initial' },
  } as unknown as ReturnType<typeof useLoginWithOAuth>)
  vi.mocked(useEmbeddedWalletState).mockReturnValue({ walletId: 'wallet-123' } as unknown as ReturnType<
    typeof useEmbeddedWalletState
  >)
  // Crypto phase runs eagerly when passcode is submitted
  mockGetAccessToken.mockResolvedValue('access-token')
  vi.mocked(encryptAndStoreRecovery).mockResolvedValue({ publicKey: 'pk', authMethodId: 'am', encryptedKeyId: 'ek' })
  // Availability check is invoked after OAuth / OTP verification; default to "available"
  // so legacy tests that expect the passcode-intro path still pass.
  vi.mocked(checkRecoveryAvailability).mockResolvedValue({ available: true })
}

function goToEmailStep() {
  fireEvent.click(screen.getByText('Email'))
}

function typeEmail(value: string) {
  const input = screen.getByPlaceholderText('Email address')
  fireEvent.change(input, { target: { value } })
}

async function goToOtpStep() {
  mockSendCode.mockResolvedValue(undefined)
  goToEmailStep()
  typeEmail('test@example.com')
  fireEvent.click(screen.getByText('Continue'))
  await waitFor(() => {
    expect(screen.getByText('Verification code')).toBeInTheDocument()
  })
}

function pasteIntoFirstInput(code: string) {
  const firstInput = document.querySelectorAll('input[inputmode="numeric"]')[0]!
  fireEvent.paste(firstInput, {
    clipboardData: { getData: () => code },
  })
}

async function goToPasscodeIntroStep() {
  mockLoginWithCode.mockResolvedValue(undefined)
  await goToOtpStep()

  pasteIntoFirstInput('123456')

  await waitFor(() => {
    expect(screen.getByText('One last step')).toBeInTheDocument()
  })
}

async function goToSetPasscodeStep() {
  await goToPasscodeIntroStep()
  fireEvent.click(screen.getAllByText('Continue').at(-1)!)
  expect(screen.getByText('Set your passcode')).toBeInTheDocument()
}

describe('AddBackupLoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders method select step by default', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    expect(screen.getByText('Add a backup login')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('navigates to email entry when Email is pressed', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    expect(screen.getByText('Email address')).toBeInTheDocument()
  })

  it('disables continue button when email is empty', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    const continueButton = screen.getByText('Continue').closest('button')
    expect(continueButton).toBeDisabled()
  })

  it('enables continue button when valid email is entered', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    typeEmail('test@example.com')
    const continueButton = screen.getByText('Continue').closest('button')
    expect(continueButton).not.toBeDisabled()
  })

  it('calls sendCode and navigates to OTP step on continue', async () => {
    mockSendCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    typeEmail('test@example.com')
    fireEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(mockSendCode).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    expect(screen.getByText('Verification code')).toBeInTheDocument()
    expect(screen.getByText('Resend code')).toBeInTheDocument()
  })

  it('navigates back from email entry to method select', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    expect(screen.getByText('Email address')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.StepHeaderBack))

    expect(screen.getByText('Add a backup login')).toBeInTheDocument()
  })

  it('resets state on close', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    expect(screen.getByText('Email address')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.StepHeaderClose))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows error when sendCode fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSendCode.mockRejectedValue(new Error('network'))
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    typeEmail('test@example.com')
    fireEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('shows error when loginWithCode fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSendCode.mockResolvedValue(undefined)
    mockLoginWithCode.mockRejectedValue(new Error('invalid code'))
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    pasteIntoFirstInput('123456')

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('resends code when Resend code is pressed', async () => {
    mockSendCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    mockSendCode.mockClear()
    fireEvent.click(screen.getByText('Resend code'))

    await waitFor(() => {
      expect(mockSendCode).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })

  it('auto-submits OTP when all digits pasted', async () => {
    mockSendCode.mockResolvedValue(undefined)
    mockLoginWithCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    pasteIntoFirstInput('123456')

    await waitFor(() => {
      expect(mockLoginWithCode).toHaveBeenCalledWith({ code: '123456' })
    })
  })

  it('handles OTP paste', async () => {
    mockSendCode.mockResolvedValue(undefined)
    mockLoginWithCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    const firstInput = document.querySelectorAll('input[inputmode="numeric"]')[0]!
    fireEvent.paste(firstInput, {
      clipboardData: { getData: () => '654321' },
    })

    await waitFor(() => {
      expect(mockLoginWithCode).toHaveBeenCalledWith({ code: '654321' })
    })
  })

  it('rejects non-digit characters in OTP inputs', async () => {
    mockSendCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    const inputs = document.querySelectorAll('input[inputmode="numeric"]')
    fireEvent.change(inputs[0]!, { target: { value: 'a' } })

    expect((inputs[0] as HTMLInputElement).value).toBe('')
  })

  it('navigates back from OTP step to email step', async () => {
    mockSendCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    fireEvent.click(screen.getByTestId(TestID.StepHeaderBack))

    expect(screen.getByText('Email address')).toBeInTheDocument()
  })

  describe('OAuth flow', () => {
    it('calls initOAuth with google when Google is clicked', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      fireEvent.click(screen.getByText('Google'))
      await waitFor(() => {
        expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'google' })
      })
    })

    it('calls initOAuth with apple when Apple is clicked', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      fireEvent.click(screen.getByText('Apple'))
      await waitFor(() => {
        expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'apple' })
      })
    })

    it('navigates to passcode intro on OAuth completion with Google', async () => {
      sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        ready: true,
        authenticated: true,
        user: { google: { email: 'user@gmail.com' } },
        getAccessToken: mockGetAccessToken,
        logout: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof usePrivy>)

      render(<AddBackupLoginModal />)

      await waitFor(() => {
        expect(screen.getByText('One last step')).toBeInTheDocument()
      })
      expect(screen.getByText('user@gmail.com')).toBeInTheDocument()
    })

    it('navigates to passcode intro on OAuth completion with Apple', async () => {
      sessionStorage.setItem('addBackupLogin:oauthProvider', 'apple')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        ready: true,
        authenticated: true,
        user: { apple: { email: 'user@icloud.com' } },
        getAccessToken: mockGetAccessToken,
      } as unknown as ReturnType<typeof usePrivy>)

      render(<AddBackupLoginModal />)

      await waitFor(() => {
        expect(screen.getByText('One last step')).toBeInTheDocument()
      })
      expect(screen.getByText('user@icloud.com')).toBeInTheDocument()
    })

    it('stores provider in sessionStorage when initiating Google OAuth', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      fireEvent.click(screen.getByText('Google'))

      // `ensureLoggedOut()` runs before `sessionStorage.setItem` + `initOAuth`.
      await waitFor(() => {
        expect(sessionStorage.getItem('addBackupLogin:oauthProvider')).toBe('google')
      })
      expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'google' })
    })

    it('stores provider in sessionStorage when initiating Apple OAuth', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      fireEvent.click(screen.getByText('Apple'))

      await waitFor(() => {
        expect(sessionStorage.getItem('addBackupLogin:oauthProvider')).toBe('apple')
      })
      expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'apple' })
    })

    it('handleClose resets OAuth sessionStorage', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)

      // Start OAuth flow to set sessionStorage
      fireEvent.click(screen.getByText('Google'))
      await waitFor(() => {
        expect(sessionStorage.getItem('addBackupLogin:oauthProvider')).toBe('google')
      })

      // Navigate to email step (which has a StepHeader with back + close buttons)
      fireEvent.click(screen.getByText('Email'))
      fireEvent.click(screen.getByTestId(TestID.StepHeaderClose))

      expect(sessionStorage.getItem('addBackupLogin:oauthProvider')).toBeNull()
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('removes sessionStorage on OAuth error', () => {
      let errorCallback: ((error: unknown) => void) | undefined
      const oauthMockImpl = (callbacks?: Record<string, unknown>) => {
        errorCallback = callbacks?.onError as ((error: unknown) => void) | undefined
        return {
          initOAuth: mockInitOAuth,
          loading: false,
          state: { status: 'initial' },
        }
      }

      vi.spyOn(console, 'error').mockImplementation(() => {})
      setupMocks()
      vi.mocked(useLoginWithOAuth).mockImplementation(oauthMockImpl as unknown as typeof useLoginWithOAuth)

      render(<AddBackupLoginModal />)
      fireEvent.click(screen.getByText('Google'))

      // Simulate OAuth error
      errorCallback?.(new Error('OAuth failed'))

      expect(sessionStorage.getItem('addBackupLogin:oauthProvider')).toBeNull()
    })

    it('passes OAuth email (not empty email state) to encryptAndStoreRecovery', async () => {
      sessionStorage.setItem('addBackupLogin:oauthProvider', 'google')

      setupMocks()
      vi.mocked(usePrivy).mockReturnValue({
        getAccessToken: mockGetAccessToken,
        user: { id: 'privy-user-123', google: { email: 'oauth@gmail.com' } },
        ready: true,
        authenticated: true,
      } as unknown as ReturnType<typeof usePrivy>)
      mockGetAccessToken.mockResolvedValue('access-token')
      vi.mocked(encryptAndStoreRecovery).mockResolvedValue({
        publicKey: 'pk',
        authMethodId: 'am',
        encryptedKeyId: 'ek',
      })

      render(<AddBackupLoginModal />)

      // Wait for OAuth return to advance to PASSCODE_INTRO
      await waitFor(() => {
        expect(screen.getByText('One last step')).toBeInTheDocument()
      })

      // Navigate to SET_PASSCODE
      fireEvent.click(screen.getAllByText('Continue').at(-1)!)

      // Enter passcode
      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })

      // Confirm passcode
      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(encryptAndStoreRecovery).toHaveBeenCalledWith(expect.objectContaining({ email: 'oauth@gmail.com' }))
      })
    })
  })

  describe('passcode flow', () => {
    it('shows passcode intro after successful OTP verification', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToPasscodeIntroStep()

      expect(screen.getByText('One last step')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('navigates to set passcode step when button clicked', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      expect(screen.getByText('Set your passcode')).toBeInTheDocument()
      const cells = document.querySelectorAll('.digit-input-cell')
      expect(cells).toHaveLength(4)
    })

    it('advances to confirm passcode step when valid PIN entered', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })
    })

    it('shows mismatch error when confirm PIN does not match', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })

      // Paste a different PIN — auto-submits on complete
      pasteIntoFirstInput('9876')

      await waitFor(() => {
        expect(screen.getByText(/Passcodes don.t match/)).toBeInTheDocument()
      })
    })

    it('completes setup when confirm PIN matches and passkey succeeds', async () => {
      setupMocks()
      vi.mocked(authorizeAndCompleteRecovery).mockResolvedValue({ recoveryQuorumId: 'quorum-1' })
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })

      // Paste matching PIN — auto-submits, crypto runs, "Confirm with passkey" appears
      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm with passkey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Confirm with passkey'))

      await waitFor(() => {
        expect(screen.getByText('Backup login added')).toBeInTheDocument()
      })
    })

    it('rejects non-digit characters in passcode inputs', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      const inputs = document.querySelectorAll('input[inputmode="numeric"]')
      fireEvent.change(inputs[0]!, { target: { value: 'x' } })

      expect((inputs[0] as HTMLInputElement).value).toBe('')
    })

    it('toggles passcode visibility', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      // The real input stays type="text" so Android keeps the numeric keypad on toggle
      // (INFRA-1912); masking is purely visual in the digit cells (• vs the digit).
      const input = document.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!
      expect(input).toHaveAttribute('type', 'text')

      fireEvent.change(input, { target: { value: '5' } })
      expect(document.querySelectorAll('.digit-input-cell')[0]).toHaveTextContent('•')

      fireEvent.click(screen.getByText('Show'))
      expect(document.querySelector('input[inputmode="numeric"]')).toHaveAttribute('type', 'text')
      expect(document.querySelectorAll('.digit-input-cell')[0]).toHaveTextContent('5')

      fireEvent.click(screen.getByText('Hide'))
      expect(document.querySelector('input[inputmode="numeric"]')).toHaveAttribute('type', 'text')
      expect(document.querySelectorAll('.digit-input-cell')[0]).toHaveTextContent('•')
    })

    it('navigates back from set passcode to passcode intro', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      fireEvent.click(screen.getByTestId(TestID.StepHeaderBack))

      expect(screen.getByText('One last step')).toBeInTheDocument()
    })

    it('closes modal from success step', async () => {
      setupMocks()
      vi.mocked(authorizeAndCompleteRecovery).mockResolvedValue({ recoveryQuorumId: 'quorum-1' })
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      pasteIntoFirstInput('5937')
      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })

      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm with passkey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Confirm with passkey'))

      await waitFor(() => {
        expect(screen.getByText('Backup login added')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Done'))
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('handles passcode paste with non-digit filtering', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      const firstInput = document.querySelectorAll('input[inputmode="numeric"]')[0]!
      fireEvent.paste(firstInput, {
        clipboardData: { getData: () => '59ab37' },
      })

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })
    })

    it('navigates back from confirm passcode to set passcode', async () => {
      setupMocks()
      render(<AddBackupLoginModal />)
      await goToSetPasscodeStep()

      pasteIntoFirstInput('5937')

      await waitFor(() => {
        expect(screen.getByText('Confirm your passcode')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId(TestID.StepHeaderBack))

      expect(screen.getByText('Set your passcode')).toBeInTheDocument()
    })
  })

  it('renders snapshot at method select step', () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    expect(document.body).toMatchSnapshot()
  })

  it('sendCode failure shows error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSendCode.mockRejectedValue(new Error('fail'))
    setupMocks()
    render(<AddBackupLoginModal />)
    goToEmailStep()
    typeEmail('test@example.com')
    fireEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('loginWithCode failure shows error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLoginWithCode.mockRejectedValue(new Error('fail'))
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    const inputs = document.querySelectorAll('input[inputmode="numeric"]')
    fireEvent.paste(inputs[0]!, { clipboardData: { getData: () => '123456' } })

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('resend code calls sendCode again', async () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    mockSendCode.mockClear()
    fireEvent.click(screen.getByText('Resend code'))

    await waitFor(() => {
      expect(mockSendCode).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })

  it('OTP paste auto-submits', async () => {
    mockLoginWithCode.mockResolvedValue(undefined)
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    const inputs = document.querySelectorAll('input[inputmode="numeric"]')
    fireEvent.paste(inputs[0]!, { clipboardData: { getData: () => '654321' } })

    await waitFor(() => {
      expect(mockLoginWithCode).toHaveBeenCalledWith({ code: '654321' })
    })
  })

  it('non-digit characters rejected in OTP', async () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    const inputs = document.querySelectorAll('input[inputmode="numeric"]')
    fireEvent.change(inputs[0]!, { target: { value: 'a' } })

    expect((inputs[0] as HTMLInputElement).value).toBe('')
  })

  it('back from OTP to email', async () => {
    setupMocks()
    render(<AddBackupLoginModal />)
    await goToOtpStep()

    fireEvent.click(screen.getByTestId(TestID.StepHeaderBack))

    expect(screen.getByText('Email address')).toBeInTheDocument()
  })

  describe('recovery availability check', () => {
    it('renders Login method already in use after email OTP when availability returns false', async () => {
      setupMocks()
      vi.mocked(checkRecoveryAvailability).mockResolvedValue({ available: false })
      mockLoginWithCode.mockResolvedValue(undefined)
      render(<AddBackupLoginModal />)
      await goToOtpStep()

      pasteIntoFirstInput('123456')

      await waitFor(() => {
        expect(screen.getByText('Login method already in use')).toBeInTheDocument()
      })
      expect(screen.queryByText('One last step')).not.toBeInTheDocument()
      expect(checkRecoveryAvailability).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        accessToken: 'access-token',
      })
    })

    it('falls through to passcode intro when availability check throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      setupMocks()
      vi.mocked(checkRecoveryAvailability).mockRejectedValue(new Error('network'))
      mockLoginWithCode.mockResolvedValue(undefined)
      render(<AddBackupLoginModal />)
      await goToOtpStep()

      pasteIntoFirstInput('123456')

      await waitFor(() => {
        expect(screen.getByText('One last step')).toBeInTheDocument()
      })
    })

    it('signs out of Privy and closes the modal when Sign out is pressed', async () => {
      setupMocks()
      const logoutSpy = vi.fn().mockResolvedValue(undefined)
      vi.mocked(usePrivy).mockReturnValue({
        getAccessToken: mockGetAccessToken,
        user: { id: 'privy-user-123' },
        ready: true,
        authenticated: false,
        logout: logoutSpy,
      } as unknown as ReturnType<typeof usePrivy>)
      vi.mocked(checkRecoveryAvailability).mockResolvedValue({ available: false })
      mockLoginWithCode.mockResolvedValue(undefined)
      render(<AddBackupLoginModal />)
      await goToOtpStep()
      pasteIntoFirstInput('123456')

      await waitFor(() => {
        expect(screen.getByText('Login method already in use')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Sign out'))

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled()
      })
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('returns to method select when Try again is pressed', async () => {
      setupMocks()
      vi.mocked(checkRecoveryAvailability).mockResolvedValue({ available: false })
      mockLoginWithCode.mockResolvedValue(undefined)
      render(<AddBackupLoginModal />)
      await goToOtpStep()
      pasteIntoFirstInput('123456')

      await waitFor(() => {
        expect(screen.getByText('Login method already in use')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try again'))

      expect(screen.getByText('Add a backup login')).toBeInTheDocument()
    })
  })
})
