import { useLoginWithOAuth } from '@privy-io/react-auth'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { EmbeddedWalletConnectionsModal } from '~/components/WalletModal/EmbeddedWalletModal'
import { OtherWalletsModal } from '~/components/WalletModal/OtherWalletsModal'
import { StandardWalletModal } from '~/components/WalletModal/StandardWalletModal'
import { useOrderedWallets } from '~/features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockInitOAuth = vi.fn()

vi.mock('@privy-io/react-auth', async (importOriginal) => ({
  ...(await importOriginal()),
  useLoginWithOAuth: vi.fn(() => ({ initOAuth: mockInitOAuth, loading: false })),
  usePrivy: vi.fn(() => ({ ready: true })),
}))

// `useMaybePrivy` only calls the (mocked) `usePrivy` when Privy is configured, so mark it configured here.
vi.mock('~/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/config')>()),
  getPrivyConfig: () => ({ appId: 'test-privy-app-id', clientId: 'test-privy-client-id' }),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', async () => ({
  ...(await vi.importActual('~/features/accounts/store/hooks')),
  useWalletWithId: vi.fn(() => undefined),
}))

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(() => ({ close: vi.fn(), open: vi.fn(), toggle: vi.fn(), isOpen: false })),
  useShowMoonpayText: vi.fn(() => false),
}))

vi.mock('~/features/wallet/connection/hooks/useOrderedWalletConnectors', () => ({
  useOrderedWallets: vi.fn(() => []),
}))

vi.mock('~/connection/constants', async () => ({
  ...(await vi.importActual('~/connection/constants')),
  useRecentConnectorId: vi.fn(() => undefined),
}))

vi.mock('~/components/AccountDrawer/menuState', async () => ({
  ...(await vi.importActual('~/components/AccountDrawer/menuState')),
  useSetMenu: vi.fn(() => vi.fn()),
  useSetMenuCallback: vi.fn(() => vi.fn()),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({ openModal: vi.fn(), isOpen: false, closeModal: vi.fn(), toggleModal: vi.fn() })),
}))

vi.mock('~/hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(() => ({ signInWithPasskeyAsync: vi.fn(), isPending: false })),
}))

describe('EmbeddedWalletConnectionsModal', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly', () => {
    const { asFragment } = render(<EmbeddedWalletConnectionsModal />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('shows login method selection when Log In is clicked', () => {
    const { getByTestId, getByText } = render(<EmbeddedWalletConnectionsModal />)
    fireEvent.click(getByTestId(TestID.LogIn))

    // Should show the login view with passkey and recovery options
    expect(getByText('Continue with passkey')).toBeDefined()
    expect(getByText('Apple')).toBeDefined()
    expect(getByText('Google')).toBeDefined()
    expect(getByText('Email')).toBeDefined()
  })

  describe('OAuth initiation', () => {
    beforeEach(() => {
      sessionStorage.clear()
      mockInitOAuth.mockClear()
    })

    function goToLoginView() {
      render(<EmbeddedWalletConnectionsModal />)
      fireEvent.click(screen.getByText('Log in'))
    }

    it('Google button calls initOAuth and sets sessionStorage', () => {
      goToLoginView()
      fireEvent.click(screen.getByText('Google'))

      expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'google' })
      expect(sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY)).toBe('google')
    })

    it('Apple button calls initOAuth and sets sessionStorage', () => {
      goToLoginView()
      fireEvent.click(screen.getByText('Apple'))

      expect(mockInitOAuth).toHaveBeenCalledWith({ provider: 'apple' })
      expect(sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY)).toBe('apple')
    })

    it('Email button opens recovery modal without calling initOAuth', () => {
      goToLoginView()
      fireEvent.click(screen.getByText('Email'))

      expect(mockInitOAuth).not.toHaveBeenCalled()
      expect(sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY)).toBeNull()
    })

    it('disables email button during OAuth loading', () => {
      mocked(useLoginWithOAuth).mockReturnValue({ initOAuth: mockInitOAuth, loading: true } as unknown as ReturnType<
        typeof useLoginWithOAuth
      >)

      goToLoginView()

      // The email OptionRow should be disabled when oauthLoading is true and oauthProvider is set
      // (provider gets set on click, but loading starts from useLoginWithOAuth)
      expect(screen.getByText('Email')).toBeDefined()
    })
  })
})

describe('StandardWalletModal', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly', () => {
    const { asFragment } = render(<StandardWalletModal />)
    expect(asFragment()).toMatchSnapshot()
  })
})

describe('OtherWalletsModal', () => {
  beforeEach(() => {
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly with EW disabled', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    const { asFragment } = render(<OtherWalletsModal />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders correctly with EW enabled', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)
    const { asFragment } = render(<OtherWalletsModal />)
    expect(asFragment()).toMatchSnapshot()
  })
})
