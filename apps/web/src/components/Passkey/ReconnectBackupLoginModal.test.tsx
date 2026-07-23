import type { RecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { ReconnectBackupLoginModal } from '~/components/Passkey/ReconnectBackupLoginModal'
import { Step, useBackupLoginFlow } from '~/components/Passkey/useBackupLoginFlow'
import { render, screen } from '~/test-utils/render'

vi.mock('~/components/Passkey/useBackupLoginFlow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/components/Passkey/useBackupLoginFlow')>()
  return { ...actual, useBackupLoginFlow: vi.fn() }
})

vi.mock('~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery', () => ({
  useListAuthenticatorsQuery: vi.fn(),
}))

const googleMethod = {
  type: 'GOOGLE',
  identifier: 'zack.labadie@uniswap.org',
  status: 'ACTIVE',
  shouldRotate: true,
} as unknown as RecoveryMethod

const digitInput = {
  digits: ['', '', '', ''],
  refs: { current: [] },
  handleChange: vi.fn(),
  handleKeyDown: vi.fn(),
  handlePaste: vi.fn(),
  reset: vi.fn(),
}

function makeFlow(step: Step) {
  return {
    isOpen: true,
    step,
    email: '',
    setEmail: vi.fn(),
    isValidEmail: false,
    isLoading: false,
    errorMessage: undefined,
    showPasscode: false,
    setShowPasscode: vi.fn(),
    isEncrypting: false,
    isCheckingReuse: false,
    isSigningIn: false,
    passcodeError: undefined,
    cryptoResult: null,
    oauthProvider: 'google' as const,
    oauthEmail: 'zack.labadie@uniswap.org',
    oauthLoading: false,
    otpInput: digitInput,
    passcodeInput: digitInput,
    confirmPasscodeInput: digitInput,
    submitCodeMutation: { isPending: false },
    handleInitOAuth: vi.fn(),
    handleSendCode: vi.fn(),
    handleResendCode: vi.fn(),
    handleClose: vi.fn(),
    handleDone: vi.fn(),
    handleBack: vi.fn(),
    handleSignInWithPasskey: vi.fn(),
    handleAlreadyInUseSignOut: vi.fn(),
    handleAlreadyInUseTryAgain: vi.fn(),
    goToEmailEntry: vi.fn(),
    goToSetPasscode: vi.fn(),
  } as unknown as ReturnType<typeof useBackupLoginFlow>
}

function renderAtStep(step: Step) {
  vi.mocked(useListAuthenticatorsQuery).mockReturnValue({
    data: { authenticators: [], recoveryMethods: [googleMethod] },
  } as unknown as ReturnType<typeof useListAuthenticatorsQuery>)
  vi.mocked(useBackupLoginFlow).mockReturnValue(makeFlow(step))
  return render(<ReconnectBackupLoginModal />)
}

describe('ReconnectBackupLoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('alert step matches the "Upgrade your backup login" mock', () => {
    renderAtStep(Step.METHOD_SELECT)
    expect(screen.getByText('Upgrade your backup login')).toBeInTheDocument()
    expect(screen.getByText(/We’ve improved security for backup logins/)).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    // Method card
    expect(screen.getByText('zack.labadie@uniswap.org')).toBeInTheDocument()
    // New-passcode-required row (replaces the old expiry banner)
    expect(screen.getByText('Sign in and set a new passcode')).toBeInTheDocument()
    // Primary CTA
    expect(screen.getByText('Upgrade')).toBeInTheDocument()
  })

  it('passcode intro step matches the "Update your passcode" mock', () => {
    renderAtStep(Step.PASSCODE_INTRO)
    expect(screen.getByText('Update your passcode')).toBeInTheDocument()
    expect(screen.getByText('Set a new passcode for extra protection.')).toBeInTheDocument()
  })

  it('set passcode step matches the "Set your new passcode" mock', () => {
    renderAtStep(Step.SET_PASSCODE)
    expect(screen.getByText('Set your new passcode')).toBeInTheDocument()
    expect(screen.getByText(/need this when using your backup login/)).toBeInTheDocument()
  })

  it('confirm passcode step matches the "Re-enter your new passcode" mock', () => {
    renderAtStep(Step.CONFIRM_PASSCODE)
    expect(screen.getByText('Re-enter your new passcode')).toBeInTheDocument()
  })

  it('success step matches the "Backup login upgraded" mock', () => {
    renderAtStep(Step.SUCCESS)
    expect(screen.getByText('Backup login upgraded')).toBeInTheDocument()
    expect(screen.getByText(/You can now use your Google account and passcode/)).toBeInTheDocument()
    expect(screen.getByText('Secured by passcode')).toBeInTheDocument()
  })
})
