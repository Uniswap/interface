import { hasActiveNeckKey, listAuthenticators } from '@universe/embedded-wallet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useOnCompleteEmbeddedWalletLogin } from '~/features/wallet/hooks/useOnCompleteEmbeddedWalletLogin'
import { useRedirectAfterConnectStore } from '~/features/wallet/hooks/useRedirectAfterConnect'
import { renderHook } from '~/test-utils/render'
import { isEmbedDocument } from '~/utils/isEmbedDocument'

// oxlint-disable-next-line no-var -- Mock hoisting requires var
var mockIsMobileWeb = false
vi.mock('@universe/environment', async () => {
  const actual = await vi.importActual('@universe/environment')
  return {
    ...actual,
    get isMobileWeb() {
      return mockIsMobileWeb
    },
  }
})

vi.mock('@wagmi/core', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    connect: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('~/features/wallet/components/WalletModal/useWagmiConnectorWithId', () => ({
  useWagmiConnectorWithId: vi.fn(() => ({ name: 'Passkey', type: 'embeddedUniswapWalletConnector' })),
}))

const mockDrawerOpen = vi.fn()
const mockDrawerClose = vi.fn()
vi.mock('~/state/accountDrawer/hooks', () => ({
  useAccountDrawer: vi.fn(() => ({ isOpen: false, open: mockDrawerOpen, close: mockDrawerClose, toggle: vi.fn() })),
}))

vi.mock('@universe/embedded-wallet/src/state/embeddedWalletStore', () => ({
  useEmbeddedWalletState: vi.fn(() => ({ setEmbeddedWalletState: vi.fn() })),
  getEmbeddedWalletState: vi.fn(() => ({ walletAddress: null, walletId: null, chainId: null, isConnected: false })),
  setChainId: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/deviceSession', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet/src/features/passkey/deviceSession')>()),
  hasActiveNeckKey: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/embeddedWallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet/src/features/passkey/embeddedWallet')>()),
  listAuthenticators: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: vi.fn(() => false),
}))

vi.mock('~/utils/isEmbedDocument', async (importOriginal) => ({
  ...(await importOriginal()),
  isEmbedDocument: vi.fn(() => false),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

const LOGIN_INPUT = { walletAddress: '0x123', walletId: 'wallet-id', exported: false }

describe('useOnCompleteEmbeddedWalletLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobileWeb = false
    useRedirectAfterConnectStore.getState().clear()
    window.history.replaceState({}, '', '/')
    vi.mocked(isEmbedDocument).mockReturnValue(false)
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(listAuthenticators).mockResolvedValue({ authenticators: [], recoveryMethods: [] } as never)
  })

  describe('rotation check gating (sign in)', () => {
    it('checks recovery methods only when a NECK session is cached (no forced challenge)', async () => {
      vi.mocked(hasActiveNeckKey).mockReturnValue(true)
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())
      await result.current({ ...LOGIN_INPUT, isCreate: false })
      expect(listAuthenticators).toHaveBeenCalledWith('wallet-id')
    })

    it('skips the recovery-method read when there is no cached NECK', async () => {
      vi.mocked(hasActiveNeckKey).mockReturnValue(false)
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())
      await result.current({ ...LOGIN_INPUT, isCreate: false })
      expect(listAuthenticators).not.toHaveBeenCalled()
    })

    it('does not check on wallet creation', async () => {
      vi.mocked(hasActiveNeckKey).mockReturnValue(true)
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())
      await result.current({ ...LOGIN_INPUT, isCreate: true })
      expect(listAuthenticators).not.toHaveBeenCalled()
    })
  })

  describe('on desktop web', () => {
    it('opens the account drawer after wallet creation', async () => {
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockDrawerOpen).toHaveBeenCalled()
      expect(mockDrawerClose).not.toHaveBeenCalled()
    })

    it('leaves the account drawer untouched after sign in', async () => {
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: false })

      expect(mockDrawerOpen).not.toHaveBeenCalled()
      expect(mockDrawerClose).not.toHaveBeenCalled()
    })
  })

  describe('on mobile web', () => {
    beforeEach(() => {
      mockIsMobileWeb = true
    })

    it('does not open the account drawer after wallet creation', async () => {
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockDrawerOpen).not.toHaveBeenCalled()
      expect(mockDrawerClose).toHaveBeenCalled()
    })

    it('closes the account drawer after sign in', async () => {
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: false })

      expect(mockDrawerOpen).not.toHaveBeenCalled()
      expect(mockDrawerClose).toHaveBeenCalled()
    })
  })

  describe('with new user UX enabled', () => {
    beforeEach(() => {
      vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.NewUserUx)
    })

    it('redirects a new wallet to Portfolio with the drawer closed', async () => {
      useRedirectAfterConnectStore.getState().request('/swap')
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockNavigate).toHaveBeenCalledWith('/portfolio')
      expect(mockDrawerClose).toHaveBeenCalled()
      expect(mockDrawerOpen).not.toHaveBeenCalled()
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UnfundedRedirectToPortfolio, {
        source: 'create',
      })
      // The create redirect replaces Landing's pending connect check.
      expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
    })

    it('keeps a new wallet on a page that can fund it, like Buy', async () => {
      window.history.replaceState({}, '', '/buy')
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(InterfaceEventName.UnfundedRedirectToPortfolio, {
        source: 'create',
      })
      expect(mockDrawerOpen).toHaveBeenCalled()
    })

    it('does not navigate again when a new wallet is created on Portfolio', async () => {
      window.history.replaceState({}, '', '/portfolio')
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockDrawerClose).toHaveBeenCalled()
      expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(InterfaceEventName.UnfundedRedirectToPortfolio, {
        source: 'create',
      })
    })

    it('keeps a new wallet in place inside an embed', async () => {
      vi.mocked(isEmbedDocument).mockReturnValue(true)
      window.history.replaceState({}, '', '/explore')
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: true })

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockDrawerOpen).toHaveBeenCalled()
    })

    it('requests the balance-checked connect redirect on sign in', async () => {
      const { result } = renderHook(() => useOnCompleteEmbeddedWalletLogin())

      await result.current({ ...LOGIN_INPUT, isCreate: false })

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(useRedirectAfterConnectStore.getState().pending).toEqual({
        pathname: '/',
        fallbackPath: undefined,
        requestedAt: expect.any(Number),
      })
    })
  })
})
