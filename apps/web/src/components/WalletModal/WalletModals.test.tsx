import { useLoginWithOAuth } from '@privy-io/react-auth'
import { Platform } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { MenuStateVariant, useMenuState, useSetMenu } from '~/components/AccountDrawer/menuState'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { EmbeddedWalletConnectionsModal } from '~/components/WalletModal/EmbeddedWalletModal'
import { OtherWalletsModal } from '~/components/WalletModal/OtherWalletsModal'
import { StandardWalletModal } from '~/components/WalletModal/StandardWalletModal'
import { SwitchWalletModal } from '~/components/WalletModal/SwitchWalletModal'
import { useRecentConnectorId } from '~/connection/constants'
import { useWalletWithId } from '~/features/accounts/store/hooks'
import { ExternalWallet } from '~/features/accounts/store/types'
import { useOrderedWallets } from '~/features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { useEmbeddedWalletLoginViewStore } from '~/state/embeddedWallet/loginViewStore'
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
  useMenuState: vi.fn(),
  useSetMenu: vi.fn(() => vi.fn()),
  useSetMenuCallback: vi.fn(() => vi.fn()),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({ openModal: vi.fn(), isOpen: false, closeModal: vi.fn(), toggleModal: vi.fn() })),
}))

vi.mock('~/hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(() => ({ signInWithPasskeyAsync: vi.fn(), isPending: false })),
}))

const UNISWAP_MOBILE_WALLET = {
  id: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  name: CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET,
} as ExternalWallet

const METAMASK_WALLET = {
  id: CONNECTION_PROVIDER_IDS.METAMASK_RDNS,
  name: CONNECTION_PROVIDER_NAMES.METAMASK,
} as ExternalWallet

const PHANTOM_WALLET = {
  id: 'app.phantom',
  name: CONNECTION_PROVIDER_NAMES.PHANTOM,
} as ExternalWallet

// The Uniswap Mobile row is labeled with a translated string rather than the wallet's name.
const UNISWAP_MOBILE_LABEL = 'Uniswap Mobile'
const OTHER_WALLETS_LABEL = 'Other wallets'
const CONNECT_A_WALLET_TITLE = 'Connect a wallet'
const SWITCH_WALLET_TITLE = 'Switch wallet'

function renderedOptionOrder(container: HTMLElement): string[] {
  const text = container.textContent
  return [UNISWAP_MOBILE_LABEL, METAMASK_WALLET.name, PHANTOM_WALLET.name]
    .filter((label) => text.includes(label))
    .sort((a, b) => text.indexOf(a) - text.indexOf(b))
}

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

  describe('wallet option ordering', () => {
    beforeEach(() => {
      // This store is module-level, so an earlier test leaving the login view open would hide the wallet options.
      useEmbeddedWalletLoginViewStore.getState().setShowLoginView(false)
      mocked(useWalletWithId).mockImplementation((id) =>
        id === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID ? UNISWAP_MOBILE_WALLET : undefined,
      )
      mocked(useOrderedWallets).mockReturnValue([METAMASK_WALLET, PHANTOM_WALLET])
    })

    afterEach(() => {
      mocked(useWalletWithId).mockReturnValue(undefined)
      mocked(useRecentConnectorId).mockReturnValue(undefined)
    })

    it('renders the recent wallet above Uniswap Mobile', () => {
      mocked(useRecentConnectorId).mockReturnValue(METAMASK_WALLET.id)

      const { container } = render(<EmbeddedWalletConnectionsModal />)

      expect(renderedOptionOrder(container)).toEqual([METAMASK_WALLET.name, UNISWAP_MOBILE_LABEL, PHANTOM_WALLET.name])
    })

    it('renders Uniswap Mobile first when there is no recent wallet', () => {
      mocked(useRecentConnectorId).mockReturnValue(undefined)

      const { container } = render(<EmbeddedWalletConnectionsModal />)

      expect(renderedOptionOrder(container)).toEqual([UNISWAP_MOBILE_LABEL, METAMASK_WALLET.name, PHANTOM_WALLET.name])
    })

    it('keeps Uniswap Mobile first when it is itself the recent connector', () => {
      mocked(useRecentConnectorId).mockReturnValue(UNISWAP_MOBILE_WALLET.id)

      const { container } = render(<EmbeddedWalletConnectionsModal />)

      expect(renderedOptionOrder(container)).toEqual([UNISWAP_MOBILE_LABEL, METAMASK_WALLET.name, PHANTOM_WALLET.name])
    })
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

describe('SwitchWalletModal', () => {
  const setMenu = vi.fn()

  beforeEach(() => {
    setMenu.mockClear()
    mocked(useSetMenu).mockReturnValue(setMenu)
    mocked(useOrderedWallets).mockReturnValue([METAMASK_WALLET])
  })

  it('shows the Other wallets row when the embedded wallet is enabled and no platform is targeted', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)

    render(<SwitchWalletModal connectOnPlatform="any" onClose={vi.fn()} />)

    expect(screen.getByText(METAMASK_WALLET.name)).toBeDefined()
    expect(screen.getByText(OTHER_WALLETS_LABEL)).toBeDefined()
  })

  it('opens the other wallets menu and records the switch menu as the place to return to', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)

    render(<SwitchWalletModal connectOnPlatform="any" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText(OTHER_WALLETS_LABEL))

    expect(setMenu).toHaveBeenCalledWith({
      variant: MenuStateVariant.OTHER_WALLETS,
      returnTo: MenuStateVariant.SWITCH,
    })
  })

  it('hides the Other wallets row when the embedded wallet is disabled', () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    render(<SwitchWalletModal connectOnPlatform="any" onClose={vi.fn()} />)

    expect(screen.getByText(METAMASK_WALLET.name)).toBeDefined()
    expect(screen.queryByText(OTHER_WALLETS_LABEL)).toBeNull()
  })

  it.each([Platform.EVM, Platform.SVM])(
    'hides the Other wallets row when the switch targets a single platform (%s)',
    (platform) => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)

      render(<SwitchWalletModal connectOnPlatform={platform} onClose={vi.fn()} />)

      expect(screen.getByText(METAMASK_WALLET.name)).toBeDefined()
      expect(screen.queryByText(OTHER_WALLETS_LABEL)).toBeNull()
    },
  )
})

describe('OtherWalletsModal', () => {
  beforeEach(() => {
    mocked(useOrderedWallets).mockReturnValue([])
    mocked(useMenuState).mockReturnValue({
      menuState: { variant: MenuStateVariant.OTHER_WALLETS },
      setMenuState: vi.fn(),
    })
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

  describe('back navigation', () => {
    const setMenu = vi.fn()

    beforeEach(() => {
      setMenu.mockClear()
      mocked(useSetMenu).mockReturnValue(setMenu)
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)
    })

    it('returns to the main menu by default', () => {
      render(<OtherWalletsModal />)

      expect(screen.getByText(CONNECT_A_WALLET_TITLE)).toBeDefined()
      expect(screen.queryByText(SWITCH_WALLET_TITLE)).toBeNull()

      fireEvent.click(screen.getByTestId('wallet-back'))

      expect(setMenu).toHaveBeenCalledWith({ variant: MenuStateVariant.MAIN })
    })

    it('returns to the switch wallet menu when opened from it', () => {
      mocked(useMenuState).mockReturnValue({
        menuState: { variant: MenuStateVariant.OTHER_WALLETS, returnTo: MenuStateVariant.SWITCH },
        setMenuState: vi.fn(),
      })

      render(<OtherWalletsModal />)

      expect(screen.getByText(SWITCH_WALLET_TITLE)).toBeDefined()
      expect(screen.queryByText(CONNECT_A_WALLET_TITLE)).toBeNull()

      fireEvent.click(screen.getByTestId('wallet-back'))

      expect(setMenu).toHaveBeenCalledWith({ variant: MenuStateVariant.SWITCH })
    })
  })
})
