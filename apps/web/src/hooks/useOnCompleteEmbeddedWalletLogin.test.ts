import { hasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import { listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { useOnCompleteEmbeddedWalletLogin } from '~/hooks/useOnCompleteEmbeddedWalletLogin'
import { renderHook } from '~/test-utils/render'

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

vi.mock('~/components/WalletModal/useWagmiConnectorWithId', () => ({
  useWagmiConnectorWithId: vi.fn(() => ({ name: 'Passkey', type: 'embeddedUniswapWalletConnector' })),
}))

const mockDrawerOpen = vi.fn()
const mockDrawerClose = vi.fn()
vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(() => ({ isOpen: false, open: mockDrawerOpen, close: mockDrawerClose, toggle: vi.fn() })),
}))

vi.mock('~/state/embeddedWallet/store', async (importOriginal) => ({
  ...(await importOriginal()),
  useEmbeddedWalletState: vi.fn(() => ({ setEmbeddedWalletState: vi.fn() })),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/deviceSession', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/passkey/deviceSession')>()),
  hasActiveNeckKey: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/embeddedWallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/passkey/embeddedWallet')>()),
  listAuthenticators: vi.fn(),
}))

const LOGIN_INPUT = { walletAddress: '0x123', walletId: 'wallet-id', exported: false }

describe('useOnCompleteEmbeddedWalletLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobileWeb = false
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
})
